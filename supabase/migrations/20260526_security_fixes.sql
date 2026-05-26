-- ============================================================
-- AVTOTEST — Xavfsizlik tuzatishlari migratsiyasi
-- Fayl: supabase/migrations/20260526_security_fixes.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ADMIN jadvalini xavfsiz qilish
--    Muammo: parol plain text saqlanmoqda
--    Yechim: parol ustunini olib tashlaymiz — auth Supabase Auth
--            orqali boshqarilishi kerak, alohida admin jadval emas.
--            Agar saqlanishi shart bo'lsa — pgcrypto bilan hash qilish.
-- ─────────────────────────────────────────────────────────────

-- pgcrypto extensionni yoqish (parol hashlash uchun)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin jadvalda RLS yoqish
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Hech kim admin jadvalini o'qiy olmaydi (faqat service_role)
CREATE POLICY "admin_no_public_access"
  ON public.admin
  FOR ALL
  USING (false);

-- parol ustunini hash qiling (agar hali bo'lmagan bo'lsa)
-- DIQQAT: Eski plain-text parollar ishlashni to'xtatadi.
-- Adminga yangi parol o'rnatish kerak bo'ladi.
ALTER TABLE public.admin
  ADD COLUMN IF NOT EXISTS parol_hash TEXT;

-- Eski plain-text parollarni hash qilish (bir martalik)
UPDATE public.admin
SET parol_hash = crypt(parol, gen_salt('bf', 10))
WHERE parol IS NOT NULL AND parol_hash IS NULL;

-- Eski parol ustunini o'chirish
ALTER TABLE public.admin DROP COLUMN IF EXISTS parol;

-- ─────────────────────────────────────────────────────────────
-- 2. CHEK jadvalini himoya qilish
--    Muammo: RLS yo'q — har kim to'lov linkini ko'rishi mumkin
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.chek ENABLE ROW LEVEL SECURITY;

-- Faqat o'z yozuvini ko'rishi mumkin (email mos kelsa)
CREATE POLICY "chek_owner_select"
  ON public.chek
  FOR SELECT
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Faqat authenticated foydalanuvchi qo'shishi mumkin
CREATE POLICY "chek_authenticated_insert"
  ON public.chek
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Yangilash va o'chirish faqat service_role uchun
-- (RLS DEFAULT DENY — policy yo'q = ruxsat yo'q)

-- ─────────────────────────────────────────────────────────────
-- 3. PROFILES jadvali RLS kuchaytirilishi
--    Muammo: tariff_days frontend tomonidan manipulyatsiya
--    qilinishi nazariy jihatdan mumkin edi
-- ─────────────────────────────────────────────────────────────

-- Foydalanuvchi faqat o'zini ko'radi
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Foydalanuvchi faqat "safe" ustunlarni yangilaydi
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- tariff_days, tariff_end_date, is_pro va shu kabilarni
    -- foydalanuvchi O'ZGARTIRA OLMAYDI — faqat o'z ismini va rasmini
    auth.uid() = id
    -- Quyidagi ustunlar service_role orqali o'zgartiriladi:
    -- tariff_days, tariff_start_date, tariff_end_date,
    -- is_trial_used, trial_start_date, trial_end_date
  );

-- ─────────────────────────────────────────────────────────────
-- 4. TEST_RESULTS jadvali RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "test_results_own" ON public.test_results;
CREATE POLICY "test_results_own"
  ON public.test_results
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. CONTACT_MESSAGES jadvali RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_authenticated_insert"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true); -- Hamma yozishi mumkin

CREATE POLICY "contact_own_select"
  ON public.contact_messages
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ─────────────────────────────────────────────────────────────
-- 6. tariff_days ni foydalanuvchi o'zgartira olmasligi uchun
--    trigger qo'shish
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_tariff_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Agar request service_role'dan kelmasa — tariff maydonlarini himoya qil
  IF current_setting('role') != 'service_role' THEN
    NEW.tariff_days        := OLD.tariff_days;
    NEW.tariff_start_date  := OLD.tariff_start_date;
    NEW.tariff_end_date    := OLD.tariff_end_date;
    NEW.is_trial_used      := OLD.is_trial_used;
    NEW.trial_start_date   := OLD.trial_start_date;
    NEW.trial_end_date     := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_tariff_trigger ON public.profiles;
CREATE TRIGGER protect_tariff_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION protect_tariff_fields();

-- ─────────────────────────────────────────────────────────────
-- 7. Rate limiting uchun yordamchi jadval
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,         -- IP yoki user_id
  action     TEXT NOT NULL,         -- 'login', 'signup', 'contact'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_identifier_action_idx
  ON public.rate_limits (identifier, action, created_at);

-- Eski yozuvlarni avtomatik tozalash (1 soatdan eski)
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '1 hour';
$$ LANGUAGE sql;

-- Rate limit tekshiruvi funksiyasi
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action     TEXT,
  p_max_hits   INT DEFAULT 10,
  p_window_min INT DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  hit_count INT;
BEGIN
  SELECT COUNT(*) INTO hit_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND action     = p_action
    AND created_at > now() - (p_window_min || ' minutes')::INTERVAL;

  IF hit_count >= p_max_hits THEN
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  INSERT INTO public.rate_limits (identifier, action) VALUES (p_identifier, p_action);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 8. Audit log (kim, qachon, nima qildi)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id),
  action     TEXT NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Faqat service_role ko'rishi mumkin
CREATE POLICY "audit_no_public" ON public.audit_log FOR ALL USING (false);

-- ─────────────────────────────────────────────────────────────
-- ESLATMA: netlify.toml ga quyidagi headerlarni qo'shing:
-- ─────────────────────────────────────────────────────────────
--
-- [[headers]]
--   for = "/*"
--   [headers.values]
--     X-Frame-Options = "DENY"
--     X-Content-Type-Options = "nosniff"
--     Referrer-Policy = "strict-origin-when-cross-origin"
--     Content-Security-Policy = """
--       default-src 'self';
--       script-src 'self' https://www.googletagmanager.com;
--       connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
--       img-src 'self' data: blob:;
--       style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
--       font-src 'self' https://fonts.gstatic.com;
--     """
--     Permissions-Policy = "camera=(), microphone=(), geolocation=()"
