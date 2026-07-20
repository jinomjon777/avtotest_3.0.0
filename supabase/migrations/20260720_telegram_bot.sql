-- ============================================================
-- AVTOTEST — Telegram bot orqali Premium sotib olish integratsiyasi
-- Fayl: supabase/migrations/20260720_telegram_bot.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CHEK jadvaliga Telegram manbasi uchun ustunlar
--    email — Telegram orqali kelganda saytdagi email bo'lmasligi
--            mumkin, shuning uchun NOT NULL cheklovini bo'shatamiz.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.chek
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.chek
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. Telegram bot suhbat holati (har bir chat_id uchun bitta qator).
--    Edge Function har chaqiriqda "xotirasiz" ishlagani uchun,
--    foydalanuvchi qaysi bosqichda turganini shu jadvalda saqlaymiz.
--    Faqat service_role (edge function) orqali o'qiladi/yoziladi.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  chat_id      BIGINT PRIMARY KEY,
  username     TEXT,
  first_name   TEXT,
  step         TEXT NOT NULL DEFAULT 'idle',
  plan_days    INTEGER,
  plan_amount  BIGINT,
  site_email   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telegram_bot_sessions_no_public_access" ON public.telegram_bot_sessions;
CREATE POLICY "telegram_bot_sessions_no_public_access"
  ON public.telegram_bot_sessions
  FOR ALL
  USING (false);

-- ─────────────────────────────────────────────────────────────
-- 3. Chek rasmlari uchun Storage bucket (screenshot/skrinshotlar).
--    Public bucket — admin panelidagi <img>/<a href> havolasi orqali
--    to'g'ridan-to'g'ri ochilishi uchun.
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;
CREATE POLICY "receipts_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

-- Yozish faqat service_role (edge function) orqali — public emas.