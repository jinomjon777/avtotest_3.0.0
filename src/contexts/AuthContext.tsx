import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { toast } from '@/hooks/use-toast';
import { registerDevice, removeCurrentDevice, revokeDevice, type DeviceRow } from '@/lib/device';
import { DEVICE_REVOKED_EVENT } from '@/lib/edge';
import { invalidateAccessState } from '@/hooks/useAccessState';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tariff_days: number;
  tariff_start_date: string | null;
  is_trial_used: boolean;
  created_at: string;
}

/** Qurilma limiti to'lganda: foydalanuvchi boshqa qurilmani chiqaradi yoki shu yerdan chiqadi. */
export interface DeviceLimitState {
  devices: DeviceRow[];
  maxDevices: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileLoading: boolean;
  deviceLimit: DeviceLimitState | null;
  signUp: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null; autoLoggedIn?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Boshqa qurilmani chiqarib, shu qurilmani ro'yxatdan o'tkazadi. */
  resolveDeviceLimit: (revokeDeviceId: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState<DeviceLimitState | null>(null);
  // Qurilma har foydalanuvchi uchun sahifa yuklanishida bir marta ro'yxatdan o'tkaziladi
  const registeredFor = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, tariff_days, tariff_start_date, is_trial_used, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Auth: profil olinmadi', error.message);
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
    };
  }, []);

  const loadProfile = useCallback((userId: string) => {
    setProfileLoading(true);
    fetchProfile(userId).then((p) => {
      setProfile(p);
      setProfileLoading(false);
    });
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
    invalidateAccessState();
  }, [user?.id, fetchProfile]);

  const resetLocalState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setDeviceLimit(null);
    registeredFor.current = null;
    invalidateAccessState();
    clearAllUserData();
  }, []);

  /** Qurilmani ro'yxatdan o'tkazish (Google, email, sessiya tiklanishi — hammasi shu yerdan o'tadi). */
  const ensureDevice = useCallback(async (u: User) => {
    if (registeredFor.current === u.id) return;
    registeredFor.current = u.id;
    const r = await registerDevice();
    if (r.status === 'limit') {
      setDeviceLimit({ devices: r.devices, maxDevices: r.maxDevices });
    } else if (r.status === 'error') {
      // Tarmoq xatosi: premium so'rovlar "device_required" bilan qayta urinadi
      registeredFor.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !currentSession?.user) {
        resetLocalState();
        setIsLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession.user);
      setIsLoading(false);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        loadProfile(currentSession.user.id);
        invalidateAccessState();
        // onAuthStateChange ichida boshqa supabase chaqiruvini kutmaslik kerak (deadlock) — keyingi tikda
        const u = currentSession.user;
        setTimeout(() => { if (isMounted) void ensureDevice(u); }, 0);
      }
    });

    // INITIAL_SESSION hodisasi kelmasa ham (eski SDK) holat aniqlansin
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted && !data.session) setIsLoading(false);
    }).catch(() => { if (isMounted) setIsLoading(false); });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, ensureDevice, resetLocalState]);

  // Boshqa qurilmadan "chiqarilgan" bo'lsa — shu yerda ham chiqamiz
  useEffect(() => {
    const onRevoked = () => {
      toast({
        title: "Hisobingiz boshqa qurilmada ochildi",
        description: "Bu qurilma hisobdan chiqarildi. Davom etish uchun qaytadan kiring.",
        variant: "destructive",
      });
      void supabase.auth.signOut();
    };
    window.addEventListener(DEVICE_REVOKED_EVENT, onRevoked);
    return () => window.removeEventListener(DEVICE_REVOKED_EVENT, onRevoked);
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    username?: string,
    fullName?: string,
  ): Promise<{ error: Error | null; autoLoggedIn?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username: username || null, full_name: fullName || null },
        },
      });
      if (error) return { error };
      // Supabase "Confirm email" o'chirilgan bo'lsa — sessiya darhol keladi; yoqilgan bo'lsa —
      // foydalanuvchi emailidagi havolani bosadi. (Avvalgi autentifikatsiyasiz "auto-confirm"
      // funksiyasi istalgan hisobni tasdiqlab yuborardi — olib tashlandi.)
      return { error: null, autoLoggedIn: !!data.session };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ?? null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error: error ?? null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await removeCurrentDevice();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    resetLocalState();
  }, [resetLocalState]);

  const resolveDeviceLimit = useCallback(async (revokeId: string): Promise<{ error: string | null }> => {
    try {
      await revokeDevice(revokeId);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Xatolik" };
    }
    const r = await registerDevice();
    if (r.status === 'ok') {
      setDeviceLimit(null);
      if (user) registeredFor.current = user.id;
      return { error: null };
    }
    if (r.status === 'limit') {
      setDeviceLimit({ devices: r.devices, maxDevices: r.maxDevices });
      return { error: "Hali ham limit to'la. Yana bitta qurilmani chiqaring." };
    }
    return { error: r.message };
  }, [user]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    profileLoading,
    deviceLimit,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    resolveDeviceLimit,
  }), [user, session, profile, isLoading, profileLoading, deviceLimit, signUp, signIn, signInWithGoogle, signOut, refreshProfile, resolveDeviceLimit]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
