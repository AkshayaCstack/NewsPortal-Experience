"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { identifyUser, resetLyticsUser } from '@/lib/lytics';

// Helper to clear all personalization data (cookies, storage)
const clearAllPersonalizationData = () => {
  // 1. Clear cookies with various domain/path combinations
  const cookiesToClear = [
    'cs_user_subscribed',
    'cs_auth_state',
    'seerid',
    'seerses',
    'cs-lytics-flows', 
    'cs-lytics-audiences',
    'cs-personalize-user-id',
    'cs-personalize-manifest',
    'cs-personalize-user-uid'
  ];
  
  const domains = [window.location.hostname, `.${window.location.hostname}`, '.lytics.io', ''];
  const paths = ['/', ''];
  
  cookiesToClear.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        const domainPart = domain ? `; domain=${domain}` : '';
        const pathPart = path ? `; path=${path}` : '';
        document.cookie = `${name}=${domainPart}${pathPart}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    });
  });
  
  // 2. Clear Session Storage items
  const sessionStorageKeys = ['contentstack_personalize'];
  sessionStorageKeys.forEach(key => {
    try { sessionStorage.removeItem(key); } catch {}
  });
  
  // 3. Clear Local Storage lytics items
  const localStorageKeys = ['lytics_segments', 'PathforaPageView'];
  localStorageKeys.forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
  
  // 4. Clear any keys containing 'lytics' or 'personalize'
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('lytics') || key.toLowerCase().includes('personalize')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('lytics') || key.toLowerCase().includes('personalize') || key.toLowerCase().includes('contentstack')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};

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


  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) await fetchSubscription(user.id);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Await profile and subscription fetch before setting loading to false
        await Promise.all([
          fetchProfile(session.user.id),
          fetchSubscription(session.user.id)
        ]);
        
        // Identify returning user in Lytics
        identifyUser({
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Create/update profile on sign in
          if (event === 'SIGNED_IN') {
            // Clear old anonymous data before identifying new user
            clearAllPersonalizationData();
            
            // Set auth state cookie to indicate user just signed in
            document.cookie = `cs_auth_state=signed_in; path=/; max-age=60`;
            
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (!existingProfile) {
              await supabase.from('profiles').insert({
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata?.avatar_url || null
              });
            }

            // Identify user in Lytics for analytics
            identifyUser({
              user_id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name,
            });
            
            // Force page reload to re-evaluate personalization with new user
            setTimeout(() => {
              window.location.href = window.location.pathname + '?_t=' + Date.now();
            }, 300);
          }
          
          // Await profile and subscription fetch
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id)
          ]);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Re-identify user with subscription data whenever subscription changes
  // This ensures Lytics has accurate subscription status for segmentation
  // Also set cookies for Personalize middleware to read
  useEffect(() => {
    if (user && !loading && subscription !== undefined) {
      const isSubscribed = !!subscription && subscription.status === 'active';
      
      // Set cookie for Personalize middleware (edge) to read
      document.cookie = `cs_user_subscribed=${isSubscribed}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
      
      identifyUser({
        user_id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.full_name,
        is_subscribed: isSubscribed,
        subscription_tier: subscription?.plan || 'free',
      });
    }
  }, [user, subscription, profile, loading]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Immediately clear local state for instant UI feedback
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    
    // Reset Lytics user to anonymous
    resetLyticsUser();
    
    // Clear ALL personalization data (cookies, localStorage, sessionStorage)
    clearAllPersonalizationData();
    
    // Set a flag cookie to tell middleware user just signed out
    document.cookie = `cs_auth_state=signed_out; path=/; max-age=60`;
    
    // Also clear all storage completely to be safe
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    
    // Call signOut in background
    supabase.auth.signOut().catch(err => console.error('Sign out error:', err));
    
    // Hard reload with cache bypass to ensure fresh state
    window.location.href = '/?_t=' + Date.now();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      showAuthModal,
      setShowAuthModal,

      signOut,
      profile,
      subscription,
      refreshProfile,
      refreshSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

