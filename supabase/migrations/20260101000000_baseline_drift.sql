-- ============================================================
-- BASELINE: migratsiyalardan tashqarida yaratilgan jadvallar
-- ============================================================
-- Production bazasida `public.admin`, `public.chek` jadvallari va `public.profiles.email` ustuni Supabase Dashboard
-- orqali yaratilgan va hech bir migratsiyada yo'q edi. Natijada repodagi migratsiyalar
-- bo'sh bazada ishlamas edi (20260526_security_fixes.sql shu jadvallarga murojaat qiladi).
--
-- Bu fayl faqat `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` ishlatadi:
--   * PRODUCTION'da hech narsani o'zgartirmaydi (jadvallar allaqachon bor);
--   * bo'sh bazada (yangi muhit, staging, test) migratsiyalarni to'liq ishlashga imkon beradi.
--
-- Ustunlar production'dan olingan haqiqiy sxemaga mos (information_schema, 2026-07).
-- `days` va `status` ustunlari ilovada ishlatilmaydi (eski qoldiq), lekin production'da bor.
-- `source`, `telegram_*` ustunlari 20260720_telegram_bot.sql da qo'shiladi.

-- Eski admin jadvali (endi admin = user_roles + Supabase Auth). Kodda ishlatilmaydi.
-- Production'da `parol_hash` qoldig'i bo'lishi mumkin — ishlatilmasligini tasdiqlab, DROP qilish tavsiya etiladi.
CREATE TABLE IF NOT EXISTS public.admin (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  parol text
);

CREATE TABLE IF NOT EXISTS public.chek (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text,
  chek_link    text,
  amount       integer,
  days         integer,
  status       text DEFAULT 'pending',
  created_at   timestamptz DEFAULT now(),
  tariff_days  integer,
  processed    boolean NOT NULL DEFAULT false
);

-- profiles.email: admin panel (Foydalanuvchilar, To'lovlar, Natijalar, Dashboard) va Telegram bot
-- premium berishda foydalanuvchini shu ustun orqali topadi, lekin ustun hech bir migratsiyada yo'q edi.
-- Production'da u qanday to'ldirilishi (trigger) ham repoda yo'q — ehtimol Dashboard orqali o'zgartirilgan.
-- Bu yerda faqat ustunning mavjudligi kafolatlanadi (production'da no-op).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
