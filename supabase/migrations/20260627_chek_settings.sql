-- ============================================================
-- AVTOTEST — "Chek" va "Sozlamalar" bo'limlari uchun migratsiya
-- Fayl: supabase/migrations/20260627_chek_settings.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CHEK jadvaliga qo'shimcha ustunlar
--    amount       — to'lov summasi (so'm)
--    tariff_days  — tanlangan tarif muddati (kun)
--    processed    — admin tomonidan ko'rib chiqilgan/faollashtirilganmi
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.chek
  ADD COLUMN IF NOT EXISTS amount BIGINT,
  ADD COLUMN IF NOT EXISTS tariff_days INTEGER,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- 2. TO'LOV TURLARI jadvali (Naqt, Karta, Click, Payme va h.k.)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Faqat service_role (edge function) orqali boshqariladi
CREATE POLICY "payment_methods_no_public_access"
  ON public.payment_methods
  FOR ALL
  USING (false);

INSERT INTO public.payment_methods (name)
SELECT name FROM (VALUES ('Naqt'), ('Karta'), ('Click'), ('Payme')) AS d(name)
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods);

-- ─────────────────────────────────────────────────────────────
-- 3. AUDIT_LOG jadvali — agar avvalgi migratsiyada yaratilmagan
--    bo'lsa (xavfsizlik), shu yerda ham kafolatlaymiz.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id),
  action     TEXT NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_no_public" ON public.audit_log;
CREATE POLICY "audit_no_public" ON public.audit_log FOR ALL USING (false);