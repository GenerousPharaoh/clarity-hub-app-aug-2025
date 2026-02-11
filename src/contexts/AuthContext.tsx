import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import useAppStore from '@/store';
import type { AppUser } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAppUser(user: User | undefined | null): AppUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? user.email ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const setUser = useAppStore((s) => s.setUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use onAuthStateChange as single source of truth (fires INITIAL_SESSION first)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(toAppUser(session?.user));
      setLoading(false);

      // Handle session expiry / token refresh failure
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Refresh failed — clear everything
        queryClient.clear();
        setUser(null);
      }
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        setUser(null);
        useAppStore.getState().setProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, queryClient]);

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    queryClient.clear();
    useAppStore.getState().setProjects([]);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
