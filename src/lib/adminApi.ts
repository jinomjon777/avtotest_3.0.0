// Admin panel: admin-premium edge funksiyasi va katta jadvallarni to'liq o'qish yordamchilari.
import { supabase } from "@/integrations/supabase/client";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-premium`;

export class AdminApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- har amalning javobi turlicha; chaqiruvchi turini beradi
export async function adminApi<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new AdminApiError("Sessiya tugagan, qayta kiring", 401);
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new AdminApiError(data.error || `Server xatosi (${res.status})`, res.status);
  return data as T;
}

/**
 * PostgREST bir so'rovda ko'pi bilan 1000 qator qaytaradi — admin statistikasi shundan keyin
 * jimgina noto'g'ri bo'lib qolardi. Bu yordamchi barcha sahifalarni ketma-ket o'qiydi.
 * `build(from, to)` — .range(from, to) qo'llangan so'rov qaytarishi kerak.
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

/** fetchAllRows'ning {data, error} ko'rinishidagi varianti (mavjud kodga moslik uchun). */
export async function selectAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    return { data: await fetchAllRows(build), error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

/** Chek rasmini ochish: Telegram cheklari yopiq bucket'da — admin uchun 10 daqiqalik imzolangan havola. */
export async function openReceipt(chekId: string): Promise<void> {
  // Popup bloklanmasligi uchun oynani darhol ochib, keyin manzilni beramiz
  const win = window.open("about:blank", "_blank");
  try {
    const { url } = await adminApi<{ url: string }>("sign_receipt", { chekId });
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (e) {
    win?.close();
    alert(e instanceof Error ? e.message : "Chekni ochib bo'lmadi");
  }
}

export type ChekStatus = "pending" | "approved" | "rejected";

export interface ChekRow {
  id: string;
  email: string | null;
  chek_link: string | null;
  created_at: string;
  amount: number | null;
  tariff_days: number | null;
  processed: boolean;
  status: ChekStatus;
  user_id: string | null;
  premium_until: string | null;
  reviewed_at: string | null;
  source?: string;
  telegram_username?: string | null;
  telegram_chat_id?: number | null;
}

export const CHEK_STATUS_LABEL: Record<ChekStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};
