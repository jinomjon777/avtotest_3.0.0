-- ============================================================
-- 2026-11-04 — XAVFSIZLIK VA MA'LUMOTLAR YAXLITLIGI (to'liq audit natijasi)
-- ============================================================
-- Idempotent: qayta ishga tushirish xavfsiz. Production'dagi schema drift'ni hisobga oladi
-- (hamma joyda IF [NOT] EXISTS / DO bloklari).
--
--  1. Premium savollarni "saqlash" orqali o'g'irlash yopildi: served_questions
--  2. "Premium" ta'rifi bitta joyda: access_state() → is_premium_now(), get_user_access_state()
--  3. Tarif maydonlarini himoya qiluvchi trigger tuzatildi (SQL Editor'dagi o'zgarish endi bekor bo'lmaydi)
--     + profiles.email foydalanuvchi tomonidan o'zgartirilmaydi va auth.users bilan sinxron
--  4. Aloqa xabarlari (contact_messages) endi faqat adminlarga ko'rinadi
--  5. Chek rasmlari bucket'i (receipts) yopiq; chek jadvali faqat server orqali yoziladi
--  6. grant_premium(): premium berishning yagona, atomar va takrorlanmas yo'li
--  7. plans: tarif narxlari bitta joyda (sayt, bot, admin)
--  8. user_sessions / device_removals: qurilma cheklovi server tomonida
--  9. has_role(): boshqa foydalanuvchining rolini tekshirib bo'lmaydi
-- 10. check_rate_limit(): faqat service_role, search_path bilan
-- 11. test_results: to'g'ridan-to'g'ri yozish yopildi (avvalgi post-deploy/001 shu yerga ko'chdi)
-- 12. Eski, ishlatilmaydigan public.admin jadvali o'chirildi
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Yordamchi: so'rov foydalanuvchi (brauzer) kontekstidanmi?
--    PostgREST har so'rovda `SET ROLE authenticated|anon` qiladi; SECURITY DEFINER funksiya
--    ichida ham bu GUC o'zgarmaydi. service_role, SQL Editor (postgres) va Supabase ichki
--    rollari (supabase_auth_admin) "server konteksti" hisoblanadi.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_client_context()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(current_setting('role', true), 'none') IN ('authenticated', 'anon');
$$;
-- Faqat SECURITY DEFINER funksiyalar ichidan chaqiriladi
REVOKE ALL ON FUNCTION public.is_client_context() FROM PUBLIC, anon, authenticated;

-- Joriy foydalanuvchining emaili (auth.users'ni brauzer roli o'qiy olmaydi — shuning uchun DEFINER)
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 0b. SCHEMA DRIFT himoyasi: production bazasi repodagi migratsiyalardan farq qiladi
--     (ba'zi jadvallar qo'lda yaratilgan). Quyida ishlatiladigan barcha ustun/jadvallar
--     mavjudligi kafolatlanadi — bor bo'lsa hech narsa o'zgarmaydi.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name  text,
  ADD COLUMN IF NOT EXISTS username   text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name       text,
  ADD COLUMN IF NOT EXISTS phone      text,
  ADD COLUMN IF NOT EXISTS subject    text,
  ADD COLUMN IF NOT EXISTS message    text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chek (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chek
  ADD COLUMN IF NOT EXISTS email       text,
  ADD COLUMN IF NOT EXISTS chek_link   text,
  ADD COLUMN IF NOT EXISTS amount      integer,
  ADD COLUMN IF NOT EXISTS tariff_days integer,
  ADD COLUMN IF NOT EXISTS processed   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         bigserial PRIMARY KEY,
  identifier text NOT NULL,
  action     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx ON public.rate_limits (identifier, action, created_at);

CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  chat_id    bigint PRIMARY KEY,
  username   text,
  first_name text,
  step       text NOT NULL DEFAULT 'idle',
  plan_days  integer,
  plan_amount integer,
  site_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES: himoyalangan maydonlar
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS tariff_days       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tariff_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS tariff_end_date   timestamptz,
  ADD COLUMN IF NOT EXISTS is_trial_used     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_start_date  timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date    timestamptz;

-- Brauzerdan kelgan UPDATE tarif/sinov/email/id maydonlarini o'zgartira olmaydi.
-- Avvalgi versiya `current_setting('role') != 'service_role'` ni tekshirardi — natijada
-- SQL Editor (postgres) va Supabase ichki rollaridagi o'zgarishlar ham JIMGINA bekor bo'lardi.
CREATE OR REPLACE FUNCTION public.protect_tariff_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_client_context() THEN
    NEW.id                 := OLD.id;
    NEW.email              := OLD.email;
    NEW.created_at         := OLD.created_at;
    NEW.tariff_days        := OLD.tariff_days;
    NEW.tariff_start_date  := OLD.tariff_start_date;
    NEW.tariff_end_date    := OLD.tariff_end_date;
    NEW.is_trial_used      := OLD.is_trial_used;
    NEW.trial_start_date   := OLD.trial_start_date;
    NEW.trial_end_date     := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_tariff_trigger ON public.profiles;
CREATE TRIGGER protect_tariff_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_tariff_fields();

-- Brauzer o'ziga profil yaratganda ham (INSERT siyosati bor) tarif/sinov berib qo'ya olmaydi
CREATE OR REPLACE FUNCTION public.protect_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_client_context() THEN
    NEW.tariff_days       := 0;
    NEW.tariff_start_date := NULL;
    NEW.tariff_end_date   := NULL;
    NEW.is_trial_used     := false;
    NEW.trial_start_date  := NULL;
    NEW.trial_end_date    := NULL;
  END IF;
  -- email har doim auth.users'dan olinadi
  NEW.email := (SELECT lower(u.email) FROM auth.users u WHERE u.id = NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_insert_trigger ON public.profiles;
CREATE TRIGGER protect_profile_insert_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_insert();

-- Tugash sanalari har doim to'ldirilgan bo'lsin — shunda "premium" ta'rifi bitta va oddiy:
-- tarif: tariff_end_date > now(); sinov: trial_end_date > now().
-- Trigger nomi "zz_" bilan: protect_* triggerlaridan KEYIN ishlaydi.
CREATE OR REPLACE FUNCTION public.normalize_access_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(NEW.tariff_days, 0) > 0 AND NEW.tariff_end_date IS NULL AND NEW.tariff_start_date IS NOT NULL THEN
    NEW.tariff_end_date := NEW.tariff_start_date + make_interval(days => NEW.tariff_days);
  END IF;
  IF coalesce(NEW.is_trial_used, false) AND NEW.trial_end_date IS NULL THEN
    NEW.trial_start_date := coalesce(NEW.trial_start_date, NEW.created_at, now());
    NEW.trial_end_date   := NEW.trial_start_date + interval '1 hour';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_normalize_access_trigger ON public.profiles;
CREATE TRIGGER zz_normalize_access_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_access_fields();

-- Mavjud yozuvlarni bir marta to'ldirish (trigger ishlaydi)
UPDATE public.profiles SET tariff_end_date = NULL
 WHERE coalesce(tariff_days, 0) > 0 AND tariff_end_date IS NULL AND tariff_start_date IS NOT NULL;
UPDATE public.profiles SET trial_end_date = NULL
 WHERE coalesce(is_trial_used, false) AND trial_end_date IS NULL;

-- profiles.email ← auth.users.email (yaratilganda va o'zgarganda)
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles SET email = lower(NEW.email)
   WHERE id = NEW.id AND email IS DISTINCT FROM lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

UPDATE public.profiles p SET email = lower(u.email)
  FROM auth.users u
 WHERE u.id = p.id AND p.email IS DISTINCT FROM lower(u.email);

CREATE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email));

-- ─────────────────────────────────────────────────────────────
-- 2. "PREMIUM" — YAGONA TA'RIF
--    Barcha joylar (edge funksiyalar, sayt, admin) shu funksiyalardan foydalanadi.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.access_state(p_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p record;
BEGIN
  IF p_uid IS NULL THEN
    RETURN jsonb_build_object('state', 'guest', 'is_premium', false, 'expires_at', NULL);
  END IF;

  SELECT tariff_days, tariff_end_date, is_trial_used, trial_end_date
    INTO p FROM public.profiles WHERE id = p_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'free_logged_in', 'is_premium', false, 'expires_at', NULL);
  END IF;

  IF coalesce(p.tariff_days, 0) > 0 AND p.tariff_end_date IS NOT NULL THEN
    IF p.tariff_end_date > now() THEN
      RETURN jsonb_build_object('state', 'active_pro', 'is_premium', true, 'expires_at', p.tariff_end_date);
    END IF;
    -- tarif tugagan, lekin faol sinov bo'lishi mumkin emas (sinov tarifdan oldin bo'ladi)
    RETURN jsonb_build_object('state', 'expired_pro', 'is_premium', false, 'expires_at', p.tariff_end_date);
  END IF;

  IF coalesce(p.is_trial_used, false) AND p.trial_end_date IS NOT NULL THEN
    IF p.trial_end_date > now() THEN
      RETURN jsonb_build_object('state', 'active_trial', 'is_premium', true, 'expires_at', p.trial_end_date);
    END IF;
    RETURN jsonb_build_object('state', 'expired_trial', 'is_premium', false, 'expires_at', p.trial_end_date);
  END IF;

  RETURN jsonb_build_object('state', 'free_logged_in', 'is_premium', false, 'expires_at', NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.access_state(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.access_state(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.is_premium_now(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((public.access_state(p_uid)->>'is_premium')::boolean, false);
$$;
REVOKE ALL ON FUNCTION public.is_premium_now(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium_now(uuid) TO service_role;

-- Brauzer uchun: faqat o'zining holati (uid JWT'dan, parametr qabul qilinmaydi)
CREATE OR REPLACE FUNCTION public.get_user_access_state()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.access_state(auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_user_access_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_access_state() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. PREMIUM SAVOLLAR: "ko'rilgan" savollar ro'yxati
--    Avval owned_question_keys() saqlangan/javob berilgan savollarni qaytarardi, lekin
--    toggle_saved_question() va submit_test() istalgan (ochiq question_locator.json'dagi)
--    kalitni qabul qilardi → bepul hisob butun premium bazani yuklab olishi mumkin edi.
--    Endi "egalik" faqat server (get-questions) haqiqatan bergan savollar asosida.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.served_questions (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key text        NOT NULL CHECK (question_key ~ '^[0-9a-f]{16}$'),
  served_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_key)
);
ALTER TABLE public.served_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.served_questions FROM PUBLIC, anon, authenticated;

-- Bir martalik: shu migratsiyagacha haqiqatan ishlangan savollar egalikda qoladi
-- (eski "Xatolarim" ro'yxatlari yo'qolmasligi uchun).
DO $$ BEGIN
  IF to_regclass('public.user_answers') IS NOT NULL THEN
    INSERT INTO public.served_questions (user_id, question_key, served_at)
    SELECT user_id, question_key, min(answered_at)
      FROM public.user_answers
     WHERE question_key ~ '^[0-9a-f]{16}$'
     GROUP BY user_id, question_key
    ON CONFLICT DO NOTHING;
  END IF;
  IF to_regclass('public.saved_questions') IS NOT NULL THEN
    INSERT INTO public.served_questions (user_id, question_key, served_at)
    SELECT user_id, question_key, created_at FROM public.saved_questions
     WHERE question_key ~ '^[0-9a-f]{16}$'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.record_served_questions(p_uid uuid, p_keys text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_n integer;
BEGIN
  IF p_uid IS NULL OR p_keys IS NULL THEN RETURN 0; END IF;
  INSERT INTO public.served_questions (user_id, question_key)
  SELECT p_uid, k FROM unnest(p_keys) AS k
   WHERE k ~ '^[0-9a-f]{16}$'
  ON CONFLICT (user_id, question_key) DO UPDATE SET served_at = now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

CREATE OR REPLACE FUNCTION public.owned_question_keys(p_uid uuid, p_keys text[])
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(array_agg(question_key), '{}')
    FROM public.served_questions
   WHERE user_id = p_uid AND question_key = ANY (p_keys);
$$;

-- Bepul foydalanuvchi: bitta kunlik sessiya uchun ko'pi bilan 3 ta tasodifiy to'plam
-- (mavzu mashqi: mavzu + zaxira; qayta urinish). Avval 5 ta edi.
CREATE OR REPLACE FUNCTION public.consume_free_sample(p_uid uuid, p_kind text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_rows integer;
BEGIN
  UPDATE public.free_daily_usage
     SET samples = samples + 1
   WHERE user_id = p_uid
     AND day = (now() AT TIME ZONE 'Asia/Tashkent')::date
     AND kind = p_kind
     AND samples < 3;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_served_questions(uuid, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owned_question_keys(uuid, text[])     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_free_sample(uuid, text)       FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_served_questions(uuid, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.owned_question_keys(uuid, text[])     TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_free_sample(uuid, text)       TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 4. ALOQA XABARLARI: faqat adminlar o'qiydi
--    Avval "contact_own_select" siyosati `user_id IS NULL` bo'lgan (ya'ni HAMMA, chunki forma
--    user_id yozmaydi) xabarlarni anon kalit bilan o'qishga ruxsat berardi: ism, telefon, telegram.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS contact_method    text,
  ADD COLUMN IF NOT EXISTS telegram_username text;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contact_messages'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.contact_messages', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "contact_insert_anyone"
  ON public.contact_messages FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "contact_admin_select"
  ON public.contact_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contact_admin_delete"
  ON public.contact_messages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE UPDATE, DELETE ON public.contact_messages FROM anon;
REVOKE UPDATE ON public.contact_messages FROM authenticated;
GRANT DELETE ON public.contact_messages TO authenticated;   -- RLS: faqat admin

-- Hajm cheklovlari (yangi yozuvlar uchun; eski yozuvlar tekshirilmaydi)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_len_chk') THEN
    ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_len_chk CHECK (
      char_length(name) BETWEEN 1 AND 120
      AND char_length(subject) <= 200
      AND char_length(message) BETWEEN 1 AND 4000
      AND (phone IS NULL OR char_length(phone) <= 32)
      AND (telegram_username IS NULL OR char_length(telegram_username) <= 64)
    ) NOT VALID;
  END IF;
END $$;

-- Spamga qarshi: bitta foydalanuvchidan (yoki anonim umumiy) daqiqasiga ko'pi bilan 5 ta xabar
CREATE OR REPLACE FUNCTION public.contact_messages_throttle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_client_context() THEN
    IF (SELECT count(*) FROM public.contact_messages
         WHERE created_at > now() - interval '1 minute'
           AND user_id IS NOT DISTINCT FROM NEW.user_id) >= 5 THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS contact_messages_throttle_trigger ON public.contact_messages;
CREATE TRIGGER contact_messages_throttle_trigger
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.contact_messages_throttle();

-- ─────────────────────────────────────────────────────────────
-- 5. CHEK (to'lovlar) va RECEIPTS bucket
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.chek
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status            text,
  ADD COLUMN IF NOT EXISTS reviewed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS premium_until     timestamptz,
  ADD COLUMN IF NOT EXISTS source            text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS telegram_chat_id  bigint,
  ADD COLUMN IF NOT EXISTS telegram_username text;

UPDATE public.chek SET status = CASE WHEN processed THEN 'approved' ELSE 'pending' END
 WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected');
ALTER TABLE public.chek ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.chek ALTER COLUMN status SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chek_status_chk') THEN
    ALTER TABLE public.chek ADD CONSTRAINT chek_status_chk CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

UPDATE public.chek c SET user_id = p.id
  FROM public.profiles p
 WHERE c.user_id IS NULL AND c.email IS NOT NULL AND lower(p.email) = lower(c.email);

CREATE INDEX IF NOT EXISTS chek_created_idx ON public.chek (created_at DESC);
CREATE INDEX IF NOT EXISTS chek_user_idx    ON public.chek (user_id);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chek'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.chek', r.policyname);
  END LOOP;
END $$;
ALTER TABLE public.chek ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchi faqat o'z to'lovlarini ko'radi. Yozish — faqat server (bot / admin-premium).
CREATE POLICY "chek_select_own"
  ON public.chek FOR SELECT
  USING (user_id = auth.uid() OR (email IS NOT NULL AND lower(email) = public.current_user_email()));
REVOKE INSERT, UPDATE, DELETE ON public.chek FROM anon, authenticated;

-- Chek rasmlari: ommaviy havola YO'Q. Admin panel imzolangan (muddatli) havola oladi.
UPDATE storage.buckets SET public = false WHERE id = 'receipts';
DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;

-- ─────────────────────────────────────────────────────────────
-- 6. TARIFLAR — yagona manba (sayt narxlari, Telegram bot, admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id         text PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{1,32}$'),
  days       integer NOT NULL CHECK (days BETWEEN 1 AND 3650),
  amount     integer NOT NULL CHECK (amount >= 0),
  label      text    NOT NULL,
  sort       integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (is_active);
REVOKE INSERT, UPDATE, DELETE ON public.plans FROM anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;

INSERT INTO public.plans (id, days, amount, label, sort) VALUES
  ('plan_7',  7,  15000, 'Haftalik', 1),
  ('plan_30', 30, 33000, 'Oylik',    2),
  ('plan_90', 90, 83000, '3 Oylik',  3)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. grant_premium(): yagona, atomar, takrorlanmas
--    * faol tarif bo'lsa — uning oxiridan uzaytiradi;
--    * chek berilsa — u faqat 'pending' holatda bo'lsa ishlaydi (ikki marta bosish = bir marta);
--    * edge funksiyalar (admin-premium, telegram-bot) faqat shu funksiyani chaqiradi.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.grant_premium(p_user uuid, p_days integer, p_chek uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_end      timestamptz;
  v_cur_end  timestamptz;
  v_rows     integer;
BEGIN
  IF p_user IS NULL OR p_days IS NULL OR p_days < 1 OR p_days > 3650 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  IF p_chek IS NOT NULL THEN
    UPDATE public.chek
       SET status = 'approved', processed = true, reviewed_at = now(), user_id = p_user
     WHERE id = p_chek AND status = 'pending';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_processed');
    END IF;
  END IF;

  SELECT CASE WHEN coalesce(tariff_days, 0) > 0 AND tariff_end_date > now() THEN tariff_end_date END
    INTO v_cur_end
    FROM public.profiles WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';   -- tranzaksiya (chek holati ham) orqaga qaytadi
  END IF;

  v_end := coalesce(v_cur_end, now()) + make_interval(days => p_days);

  UPDATE public.profiles
     SET tariff_days = p_days,
         tariff_start_date = now(),
         tariff_end_date = v_end
   WHERE id = p_user;

  IF p_chek IS NOT NULL THEN
    UPDATE public.chek SET premium_until = v_end WHERE id = p_chek;
  END IF;

  RETURN jsonb_build_object('ok', true, 'end_date', v_end);
END;
$$;
REVOKE ALL ON FUNCTION public.grant_premium(uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_premium(uuid, integer, uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 8. QURILMALAR (2 ta qurilma cheklovi) — server tomonida
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id   text        NOT NULL,
  device_info text,
  last_seen   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- Jadval production'da qo'lda yaratilgan bo'lishi mumkin: kerakli ustunlar kafolatlanadi
ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_info text,
  ADD COLUMN IF NOT EXISTS last_seen   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_sessions'
       AND indexdef ILIKE '%UNIQUE%(user_id, device_id)%'
  ) THEN
    -- takroriy qatorlarni olib tashlab, keyin unikal indeks
    DELETE FROM public.user_sessions a USING public.user_sessions b
     WHERE a.user_id = b.user_id AND a.device_id = b.device_id AND a.ctid < b.ctid;
    CREATE UNIQUE INDEX user_sessions_user_device_uidx ON public.user_sessions (user_id, device_id);
  END IF;
END $$;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_sessions FROM PUBLIC, anon, authenticated;

-- Boshqa qurilmani chiqarish tarixi: hisob ulashishga qarshi (haftasiga ko'pi bilan 3 ta)
CREATE TABLE IF NOT EXISTS public.device_removals (
  id         bigserial   PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id  text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_removals_user_idx ON public.device_removals (user_id, created_at DESC);
ALTER TABLE public.device_removals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.device_removals FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 9. TELEGRAM BOT: suhbat holatiga kutilayotgan chek va email urinishlari
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.telegram_bot_sessions
  ADD COLUMN IF NOT EXISTS username         text,
  ADD COLUMN IF NOT EXISTS first_name       text,
  ADD COLUMN IF NOT EXISTS step             text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS plan_days        integer,
  ADD COLUMN IF NOT EXISTS plan_amount      integer,
  ADD COLUMN IF NOT EXISTS site_email       text,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS receipt_file_id  text,
  ADD COLUMN IF NOT EXISTS receipt_url      text,
  ADD COLUMN IF NOT EXISTS pending_chek_id  uuid,
  ADD COLUMN IF NOT EXISTS email_attempts   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_window     timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 10. has_role(): oddiy foydalanuvchi FAQAT o'zining rolini tekshira oladi
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN public.is_client_context() AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 11. RATE LIMIT yordamchilari: faqat server
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action     text,
  p_max_hits   integer DEFAULT 10,
  p_window_min integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE hit_count integer;
BEGIN
  -- vaqti-vaqti bilan eski yozuvlarni tozalash (alohida cron shart emas)
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 day';
  END IF;

  SELECT count(*) INTO hit_count
    FROM public.rate_limits
   WHERE identifier = p_identifier
     AND action     = p_action
     AND created_at > now() - make_interval(mins => p_window_min);

  IF hit_count >= p_max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (identifier, action) VALUES (p_identifier, p_action);
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 day';
$$;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 12. TEST_RESULTS: faqat submit_test() orqali yoziladi
--     (avvalgi post-deploy/001_lock_test_results_writes.sql — sayt allaqachon submit_test'ga o'tgan)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'test_results'
              AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.test_results', r.policyname);
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'test_results'
                    AND policyname = 'test_results_select_own') THEN
    CREATE POLICY "test_results_select_own" ON public.test_results
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'test_results'
                    AND policyname = 'test_results_admin_read') THEN
    CREATE POLICY "test_results_admin_read" ON public.test_results
      FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
REVOKE INSERT, UPDATE, DELETE ON public.test_results FROM anon, authenticated;

-- test_sessions: brauzer to'g'ridan-to'g'ri yozmasin (faqat SECURITY DEFINER funksiyalar)
DO $$ BEGIN
  IF to_regclass('public.test_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.test_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own sessions" ON public.test_sessions';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.test_sessions FROM anon, authenticated';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 13. Eski admin jadvali (endi admin = user_roles + Supabase Auth). Kodda ishlatilmaydi.
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.admin;

NOTIFY pgrst, 'reload schema';
