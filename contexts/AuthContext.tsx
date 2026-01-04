"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { identifyUser, resetLyticsUser } from "@/lib/lytics";

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
        resolveAuth(data?.session ?? null);
      })
      .catch((err) => {
        console.error("[AUTH] getSession error", err);
        resolveAuth(null);
      })
      .finally(() => clearTimeout(timeout));

    // Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AUTH] auth change", event);
        resolveAuth(session);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    resetLyticsUser();
    await supabase.auth.signOut();
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
