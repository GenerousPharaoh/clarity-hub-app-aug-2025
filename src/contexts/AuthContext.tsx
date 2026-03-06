import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import useAppStore from '@/store';
import type { AppUser } from '@/types';
import {
  DEMO_AUTH_USER,
  disableDemoMode,
  enableDemoMode,
  ensureDemoState,
  isDemoModeEnabled,
  resetDemoState,
} from '@/lib/demo';
import { clearWorkspaceSession } from '@/lib/workspaceSession';

type AuthUser = Pick<User, 'id' | 'email' | 'created_at' | 'user_metadata'>;

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => Promise<void>;
  resetDemoWorkspace: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 8_000;

function toAppUser(user: AuthUser | undefined | null): AppUser | null {
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
  const [isDemoMode, setIsDemoMode] = useState(() => isDemoModeEnabled());
  const [demoUser, setDemoUser] = useState<AuthUser | null>(() =>
    isDemoModeEnabled() ? DEMO_AUTH_USER : null
  );
  const setUser = useAppStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const applyAuthState = useCallback(
    (nextSession: Session | null, event?: string) => {
      if (nextSession?.user) {
        disableDemoMode();
      }

      const demoEnabled = !nextSession && isDemoModeEnabled();
      const effectiveDemoUser = demoEnabled ? DEMO_AUTH_USER : null;

      setSession(nextSession);
      setIsDemoMode(demoEnabled);
      setDemoUser(effectiveDemoUser);
      setUser(toAppUser(nextSession?.user ?? effectiveDemoUser));
      setLoading(false);

      if (event === 'TOKEN_REFRESHED' && !nextSession) {
        queryClient.clear();
        setUser(null);
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        setUser(null);
        useAppStore.getState().setProjects([]);
      }
    },
    [queryClient, setUser]
  );

  useEffect(() => {
    let cancelled = false;
    let initialized = false;

    // Subscribe first so auth events aren't missed during bootstrap.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return;
      initialized = true;
      applyAuthState(nextSession, event);
    });

    const bootstrap = async () => {
      try {
        const {
          data: { session: existingSession },
          error,
        } = await supabase.auth.getSession();

        if (cancelled) return;
        if (error) {
          console.error('[AuthProvider] Failed to read initial session:', error);
        }

        initialized = true;
        applyAuthState(existingSession ?? null, 'INITIAL_SESSION');
      } catch (error) {
        if (cancelled) return;
        console.error('[AuthProvider] Session bootstrap failed:', error);
        initialized = true;
        applyAuthState(null, 'INITIAL_SESSION_ERROR');
      }
    };

    const bootstrapTimeout = window.setTimeout(() => {
      if (cancelled || initialized) return;
      console.warn('[AuthProvider] Session bootstrap timed out; falling back to unauthenticated state.');
      initialized = true;
      applyAuthState(null, 'INITIAL_SESSION_TIMEOUT');
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    void bootstrap();

    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTimeout);
      subscription.unsubscribe();
    };
  }, [applyAuthState]);

  const signInWithGoogle = async () => {
    disableDemoMode();
    clearWorkspaceSession();
    setIsDemoMode(false);
    setDemoUser(null);
    setUser(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const enterDemoMode = async () => {
    ensureDemoState();
    enableDemoMode();
    queryClient.clear();
    useAppStore.getState().setProjects([]);
    useAppStore.getState().setFiles([]);
    setSession(null);
    setDemoUser(DEMO_AUTH_USER);
    setIsDemoMode(true);
    setUser(toAppUser(DEMO_AUTH_USER));
    setLoading(false);
  };

  const signOut = async () => {
    queryClient.clear();
    clearWorkspaceSession();
    useAppStore.getState().setProjects([]);
    useAppStore.getState().setFiles([]);
    setUser(null);
    disableDemoMode();
    setIsDemoMode(false);
    setDemoUser(null);
    setSession(null);
    if (session) {
      await supabase.auth.signOut();
    }
  };

  const resetDemoWorkspace = async () => {
    if (!isDemoModeEnabled()) return;
    resetDemoState();
    clearWorkspaceSession();
    useAppStore.getState().setProjects([]);
    useAppStore.getState().setFiles([]);
    await queryClient.invalidateQueries();
    toast.success('Demo workspace restored');
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? demoUser,
        session,
        loading,
        isDemoMode,
        signInWithGoogle,
        signOut,
        enterDemoMode,
        resetDemoWorkspace,
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
