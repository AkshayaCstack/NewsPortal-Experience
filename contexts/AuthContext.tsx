"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { identifyUser, fullPersonalizationReset } from "@/lib/lytics";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: Profile | null;
  subscription: Subscription | null;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (value: boolean) => void;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /* -------------------- SAFE HELPERS -------------------- */

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error) setProfile(data);
    } catch (e) {
      console.warn("[AUTH] profile fetch failed");
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (!error) setSubscription(data);
    } catch (e) {
      console.warn("[AUTH] subscription fetch failed");
    }
  };

  const refreshProfile = async () => {
    if (user) fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) fetchSubscription(user.id);
  };

  /* -------------------- AUTH INIT -------------------- */

  // Helper to clear stale auth data
  const clearStaleAuth = async () => {
    console.log("[AUTH] Clearing stale auth data...");
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors during cleanup
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setLoading(false);
  };

  useEffect(() => {
    console.log("[AUTH] AuthProvider mounted");

    let resolved = false;

    const resolveAuth = (session: Session | null) => {
      if (resolved) return;
      resolved = true;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
      }
    };

    // ⏱ HARD TIMEOUT — NEVER HANG
    const timeout = setTimeout(() => {
      console.warn("[AUTH] auth timeout → forcing anonymous");
      resolveAuth(null);
    }, 3000);

    // Initial session check
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        console.log("[AUTH] getSession result", { data, error });
        
        // Handle invalid refresh token error
        if (error?.message?.includes("Refresh Token") || error?.message?.includes("Invalid")) {
          console.warn("[AUTH] Invalid refresh token detected, clearing stale auth");
          clearStaleAuth();
          return;
        }
        
        resolveAuth(data?.session ?? null);
      })
      .catch((err) => {
        console.error("[AUTH] getSession error", err);
        // Clear stale auth on any auth error
        if (err?.message?.includes("Refresh Token") || err?.message?.includes("Invalid")) {
          clearStaleAuth();
        } else {
          resolveAuth(null);
        }
      })
      .finally(() => clearTimeout(timeout));

    // Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AUTH] auth change", event);
        
        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          console.warn("[AUTH] Token refresh failed, clearing auth");
          clearStaleAuth();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchSubscription(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  /* -------------------- LYTICS IDENTIFY -------------------- */

  useEffect(() => {
    if (!user) return;

    identifyUser({
      user_id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.full_name,
      is_subscribed: !!subscription,
      subscription_tier: subscription?.plan || "free",
    });
  }, [user, subscription, profile]);

  /* -------------------- AUTH ACTIONS -------------------- */

  const signUp = async (email: string, password: string, name: string) => {
    console.log('[AUTH] Sign up started...');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    
    if (!error) {
      console.log('[AUTH] Sign up successful, force reloading for fresh personalization...');
      // Force reload to ensure middleware runs with new auth state
      window.location.reload();
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH] Sign in started...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error) {
      console.log('[AUTH] Sign in successful, force reloading for fresh personalization...');
      // Force reload to ensure middleware runs with new auth state
      // This ensures Lytics identifies user and Personalize fetches new variant
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    console.log('[AUTH] Google sign in started...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // Note: OAuth redirects, so no need to reload here
    return { error };
  };

  const signOut = async () => {
    console.log('[AUTH] Sign out started...');

    // 1. Sign out from Supabase first
    await supabase.auth.signOut();

    window.location.reload();
    console.log('[AUTH] Supabase sign out complete');
    
    // 2. Clear local state
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    console.log('[AUTH] Local state cleared');
    
    // 3. Reset Lytics and clear personalization cookies
    console.log('[AUTH] Calling fullPersonalizationReset...');
    fullPersonalizationReset();
    console.log('[AUTH] Personalization reset complete');
    
    // 4. Force reload to ensure middleware runs fresh
    // This ensures anonymous user gets correct variant
    setTimeout(() => {
      console.log('[AUTH] Force reloading page...');
      window.location.href = '/';
    }, 300);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        profile,
        subscription,
        refreshProfile,
        refreshSubscription,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
