import * as React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabaseClient from '../services/supabaseClient';
import { useAppStore } from '../store';
import { demoService, DEMO_USER_ID } from '../services/demoService';

// Admin user ID for special handling
const ADMIN_EMAIL = 'kareem.hassanein@gmail.com';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  /** Inject a user manually (demo / tests) */
  setUserManually: (u: Partial<User> | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid loading state
  const setStoreUser = useAppStore((state) => state.setUser);
  
  // Initialize persistent demo account for demo mode
  React.useEffect(() => {
    if (false) { // Disabled demo mode
      const initDemo = async () => {
        try {
          const { user: demoUserData } = await demoService.initializeDemoAccount();
          
          const demoUser = {
            id: DEMO_USER_ID,
            email: demoUserData.email,
            user_metadata: {
              avatar_url: demoUserData.avatar_url,
              full_name: demoUserData.full_name
            }
          } as User;
          
          setUser(demoUser);
          setLoading(false);
          console.log('Persistent demo user initialized');
        } catch (error) {
          console.error('Failed to initialize demo:', error);
          // Fallback to basic demo user
          const fallbackUser = {
            id: DEMO_USER_ID,
            email: 'demo@clarityhub.ai',
            user_metadata: {
              avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff',
              full_name: 'Demo User'
            }
          } as User;
          setUser(fallbackUser);
          setLoading(false);
        }
      };
      
      initDemo();
    }
  }, []);

  // Memoize functions to prevent unnecessary re-renders
  const signIn = useCallback(async (email: string, password: string) => {
    // For admin account, use extended session duration
    const options = email === ADMIN_EMAIL ? { 
      expiresIn: 30 * 24 * 60 * 60 // 30 days 
    } : undefined;

    const response = await supabaseClient.auth.signInWithPassword({ 
      email, 
      password
    });

    // For admin login, ensure store is updated correctly
    if (!response.error && response.data.user && email === ADMIN_EMAIL) {
      console.log('Admin signed in, ensuring store is synced');
      setStoreUser({
        id: response.data.user.id,
        email: response.data.user.email || '',
        avatar_url: response.data.user.user_metadata?.avatar_url,
        full_name: response.data.user.user_metadata?.full_name || 'Admin User',
        is_admin: true
      });
    }

    return response;
  }, [setStoreUser]);

  const signUp = useCallback((email: string, password: string) => {
    return supabaseClient.auth.signUp({ email, password });
  }, []);

  const signOut = useCallback(() => {
    return supabaseClient.auth.signOut();
  }, []);

  const resetPassword = useCallback((email: string) => {
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  // Add setUserManually function for demo login
  const setUserManually = useCallback((u: Partial<User> | null) => {
    setUser(u as User | null);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Hydrate from cached session
    supabaseClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('getSession error:', error.message);
          // Don't create demo user - just clear session
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const isAdmin = currentSession.user.email === ADMIN_EMAIL;
          setStoreUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            avatar_url: currentSession.user.user_metadata?.avatar_url,
            full_name: currentSession.user.user_metadata?.full_name || (isAdmin ? 'Admin User' : ''),
            is_admin: isAdmin
          });
        } else {
          // No session - clear user
          setUser(null);
          setStoreUser(null);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('Error getting session:', error);
        
        // Clear user on error
        setUser(null);
        setStoreUser(null);
        
        if (mounted) setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          console.log('Setting user in store:', session.user.id);
          const isAdmin = session.user.email === ADMIN_EMAIL;
          setUser(session.user);
          setStoreUser({
            id: session.user.id,
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url,
            full_name: session.user.user_metadata?.full_name || (isAdmin ? 'Admin User' : ''),
            is_admin: isAdmin
          });
        } else if (event === 'SIGNED_OUT') {
          // Clear user on sign out
          setUser(null);
          setStoreUser(null);
          console.log('User signed out');
        } else {
          // No session - clear user
          setUser(null);
          setStoreUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setStoreUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    setUserManually,
  }), [session, user, loading, signIn, signUp, signOut, resetPassword, setUserManually]);

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