// Foydalanuvchining premium holati — YAGONA manba: bazadagi get_user_access_state() RPC
// (server vaqti; edge funksiyalar ham aynan shu access_state() ni ishlatadi).
// Barcha komponentlar bitta umumiy holatni bo'lishadi: bitta so'rov, bitta interval.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AccessState =
  | 'guest'
  | 'free_logged_in'
  | 'active_trial'
  | 'expired_trial'
  | 'active_pro'
  | 'expired_pro';

export interface AccessInfo {
  state: AccessState;
  isPremium: boolean;
  expiresAt: Date | null;
  loading: boolean;
  /** Server javobi olinganmi (tarmoq xatosida false — premium sahifalar kutib turadi) */
  backendConfirmed: boolean;
}

const REFRESH_MS = 60_000;
const STATES: AccessState[] = ['guest', 'free_logged_in', 'active_trial', 'expired_trial', 'active_pro', 'expired_pro'];

const LOADING: AccessInfo = { state: 'guest', isPremium: false, expiresAt: null, loading: true, backendConfirmed: false };
const GUEST: AccessInfo = { state: 'guest', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true };

let current: AccessInfo = LOADING;
let currentUid: string | null | undefined;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(next: AccessInfo) {
  current = next;
  listeners.forEach((l) => l());
  // Muddat tugash paytida holatni darhol yangilaymiz (keyingi intervalni kutmasdan)
  if (expiryTimer) clearTimeout(expiryTimer);
  if (next.isPremium && next.expiresAt) {
    const ms = next.expiresAt.getTime() - Date.now() + 1000;
    if (ms > 0 && ms < 2_147_000_000) expiryTimer = setTimeout(() => void load(currentUid ?? null, true), ms);
  }
}

async function load(uid: string | null, force = false): Promise<void> {
  if (!uid) {
    currentUid = null;
    emit(GUEST);
    return;
  }
  if (!force && uid === currentUid && Date.now() - fetchedAt < REFRESH_MS / 2 && !current.loading) return;
  if (inflight && uid === currentUid) return inflight;
  if (uid !== currentUid) {
    currentUid = uid;
    emit(LOADING);
  }
  inflight = (async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_access_state');
      if (uid !== currentUid) return;
      if (error || !data) throw error ?? new Error('empty');
      const d = data as { state?: string; is_premium?: boolean; expires_at?: string | null };
      const state = (STATES as string[]).includes(d.state ?? '') ? (d.state as AccessState) : 'free_logged_in';
      fetchedAt = Date.now();
      emit({
        state,
        isPremium: !!d.is_premium,
        expiresAt: d.expires_at ? new Date(d.expires_at) : null,
        loading: false,
        backendConfirmed: true,
      });
    } catch {
      if (uid !== currentUid) return;
      // Server javob bermadi: oldingi tasdiqlangan holat bo'lsa saqlanadi, aks holda "tasdiqlanmagan"
      if (!current.backendConfirmed) {
        emit({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
      }
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Tarif o'zgarganda (premium berildi, chiqish) — keyingi o'qishda serverdan qayta oladi. */
export function invalidateAccessState(): void {
  fetchedAt = 0;
  if (currentUid) void load(currentUid, true);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => { if (currentUid) void load(currentUid, true); }, REFRESH_MS);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export const useAccessState = (): AccessInfo & { refresh: () => Promise<void> } => {
  const { user, isLoading: authLoading } = useAuth();
  const info = useSyncExternalStore(subscribe, () => current, () => LOADING);
  const uid = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    void load(uid);
  }, [uid, authLoading]);

  const refresh = useCallback(() => load(uid, true), [uid]);

  if (authLoading) return { ...LOADING, refresh };
  // Foydalanuvchi almashgan, lekin yangi javob hali kelmagan — eski foydalanuvchining holati ko'rsatilmasin
  if (uid !== (currentUid ?? null)) return { ...(uid ? LOADING : GUEST), refresh };
  return { ...info, refresh };
};
