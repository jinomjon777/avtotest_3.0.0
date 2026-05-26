import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tariff_days: number;
  tariff_start_date: string | null;
  is_trial_used: boolean;
  created_at: string;
  is_pro: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Auth Error - Profile fetch:', error);
        return null;
      }
      
      if (!data) return null;
      
      const tariffDays = data.tariff_days ?? 0;

      return {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        tariff_days: tariffDays,
        tariff_start_date: data.tariff_start_date ?? null,
        is_trial_used: data.is_trial_used ?? false,
        created_at: data.created_at,
        is_pro: tariffDays > 0,
      };
    } catch (err) {
      console.error('Auth Error - Profile exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) setProfile(profileData);
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch profile in background - don't block on it
          setProfileLoading(true);
          fetchProfile(currentSession.user.id).then(profileData => {
            if (isMounted) {
              setProfile(profileData);
              setProfileLoading(false);
            }
          });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Auth Error - Initialization:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        try {
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
            clearAllUserData();
            return;
          }
          
          if (event === 'TOKEN_REFRESHED' && !currentSession) {
            console.log('Token refresh failed');
            setSession(null);
            setUser(null);
            setProfile(null);
            clearAllUserData();
            return;
          }
          
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // Fetch profile on sign-in so PRO access is available immediately without a page refresh
          if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            setProfileLoading(true);
            fetchProfile(currentSession.user.id).then(profileData => {
              if (isMounted) {
                setProfile(profileData);
                setProfileLoading(false);
              }
            });
          } else if (!currentSession?.user) {
            setProfile(null);
            setProfileLoading(false);
          }
        } catch (err) {
          console.error('Auth Error - State change:', err);
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    username?: string,
    fullName?: string
  ): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { username: username || null, full_name: fullName || null },
        }
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    clearAllUserData();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={useMemo(() => ({
      user,
      session,
      profile,
      isLoading,
      profileLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }), [user, session, profile, isLoading, profileLoading, signUp, signIn, signInWithGoogle, signOut, refreshProfile])}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
