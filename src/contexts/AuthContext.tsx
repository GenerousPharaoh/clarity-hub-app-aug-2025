import * as React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUser = useAppStore((state) => state.setUser);

  const syncUserToStore = useCallback(
    (u: User | null) => {
      setUser(u);
      if (u) {
        setStoreUser({
          id: u.id,
          email: u.email || '',
          avatar_url: u.user_metadata?.avatar_url,
          full_name: u.user_metadata?.full_name || '',
        });
      } else {
        setStoreUser(null);
      }
    },
    [setStoreUser]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(() => {
    return supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('getSession error:', error.message);
          syncUserToStore(null);
          setSession(null);
          setLoading(false);
          return;
        }
        const s = data.session;
        setSession(s);
        syncUserToStore(s?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error getting session:', err);
        syncUserToStore(null);
        setSession(null);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setSession(session);
          syncUserToStore(session?.user ?? null);
          break;
        case 'SIGNED_OUT':
          setSession(null);
          syncUserToStore(null);
          break;
        case 'USER_UPDATED':
          setSession(session);
          syncUserToStore(session?.user ?? null);
          break;
        default:
          setSession(session);
          syncUserToStore(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserToStore]);

  const value = useMemo(
    () => ({ session, user, loading, signInWithGoogle, signOut }),
    [session, user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
