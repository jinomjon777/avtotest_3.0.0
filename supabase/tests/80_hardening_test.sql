-- 20261104000000_security_hardening.sql: sh supabase/tests/run.sh supabase/tests/80_hardening_test.sql
-- Har bir test audit topgan aniq muammoni qayta yaratadi va endi yopilganini tekshiradi.
\set ON_ERROR_STOP 0
\set F '''f0000000-0000-0000-0000-000000000001'''
\set G '''f0000000-0000-0000-0000-000000000002'''
\set ADM '''f0000000-0000-0000-0000-0000000000ad'''
CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;

INSERT INTO auth.users (id, email) VALUES (:F,'Free@Q.uz'), (:G,'g@q.uz'), (:ADM,'adm@q.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id) VALUES (:F), (:G), (:ADM) ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role) VALUES (:ADM, 'admin') ON CONFLICT DO NOTHING;

-- ── 1. Premium savollarni "saqlash" orqali olish ──────────────────────────
SELECT set_config('request.jwt.claim.sub', :F, false);
SET ROLE authenticated;
SELECT public.toggle_saved_question('0022d1cbacdb08b7');
SELECT public.submit_test(NULL, 98, 1, 1, 10, '[{"question_key":"004fa747582bc577","is_correct":true}]'::jsonb);
RESET ROLE;
DO $$ BEGIN PERFORM public.__t('1. saqlangan/soxta javob berilgan premium kalit egalikka O''TMAYDI',
  cardinality(public.owned_question_keys('f0000000-0000-0000-0000-000000000001', ARRAY['0022d1cbacdb08b7','004fa747582bc577'])) = 0); END $$;

-- ── 2. Aloqa xabarlari ────────────────────────────────────────────────────
SET ROLE anon;
DO $$ BEGIN
  INSERT INTO public.contact_messages (name, phone, subject, message) VALUES ('Ali', '+998901234567', 's', 'maxfiy');
  PERFORM public.__t('2a. anon xabar yubora oladi', true);
EXCEPTION WHEN OTHERS THEN PERFORM public.__t('2a. anon xabar yubora oladi: ' || SQLERRM, false); END $$;
DO $$ BEGIN PERFORM public.__t('2b. anon xabarlarni O''QIY OLMAYDI', (SELECT count(*) FROM public.contact_messages) = 0); END $$;
DO $$ BEGIN
  INSERT INTO public.contact_messages (name, subject, message, user_id) VALUES ('X', 's', 'm', 'f0000000-0000-0000-0000-000000000002');
  PERFORM public.__t('2c. anon boshqa user_id bilan yoza olmaydi', false);
EXCEPTION WHEN OTHERS THEN PERFORM public.__t('2c. anon boshqa user_id bilan yoza olmaydi', true); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :F, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('2d. oddiy foydalanuvchi ham o''qiy olmaydi', (SELECT count(*) FROM public.contact_messages) = 0); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :ADM, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('2e. admin o''qiydi', (SELECT count(*) FROM public.contact_messages) >= 1); END $$;
RESET ROLE;

-- ── 3. Tarif himoyasi ─────────────────────────────────────────────────────
-- SQL Editor (postgres) dan berilgan tarif endi saqlanadi
UPDATE public.profiles SET tariff_days = 30, tariff_start_date = now() WHERE id = :G;
DO $$ BEGIN PERFORM public.__t('3a. SQL Editor''dan tarif SAQLANADI (+ tugash sanasi avtomatik)',
  (SELECT tariff_days = 30 AND tariff_end_date > now() + interval '29 days' FROM public.profiles WHERE id = 'f0000000-0000-0000-0000-000000000002')); END $$;
-- Brauzer o'ziga tarif/email bera olmaydi
SELECT set_config('request.jwt.claim.sub', :F, false);
SET ROLE authenticated;
UPDATE public.profiles SET tariff_days = 999, tariff_end_date = now() + interval '1 year', is_trial_used = true,
       trial_end_date = now() + interval '1 year', email = 'boshqa@gmail.com', full_name = 'Yangi ism'
 WHERE id = 'f0000000-0000-0000-0000-000000000001';
RESET ROLE;
DO $$ BEGIN PERFORM public.__t('3b. brauzer tarif/sinov/email''ni o''zgartira OLMAYDI, ismni o''zgartiradi',
  (SELECT tariff_days = 0 AND tariff_end_date IS NULL AND NOT is_trial_used AND email = 'free@q.uz' AND full_name = 'Yangi ism'
     FROM public.profiles WHERE id = 'f0000000-0000-0000-0000-000000000001')); END $$;
-- email auth.users bilan sinxron
UPDATE auth.users SET email = 'new@q.uz' WHERE id = :F;
DO $$ BEGIN PERFORM public.__t('3c. profiles.email auth.users bilan sinxron',
  (SELECT email = 'new@q.uz' FROM public.profiles WHERE id = 'f0000000-0000-0000-0000-000000000001')); END $$;

-- ── 4. Yagona premium ta'rifi ─────────────────────────────────────────────
UPDATE public.profiles SET is_trial_used = true WHERE id = :F;   -- trial_end_date bo'sh → avtomatik
DO $$ DECLARE s jsonb := public.access_state('f0000000-0000-0000-0000-000000000001'); BEGIN
  PERFORM public.__t('4a. sinov: tugash sanasi avtomatik, holat active_trial', s->>'state' = 'active_trial');
  PERFORM public.__t('4b. is_premium_now access_state bilan bir xil', public.is_premium_now('f0000000-0000-0000-0000-000000000001'));
END $$;
SELECT set_config('request.jwt.claim.sub', :G, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('4c. get_user_access_state faqat o''zini (G = active_pro)', public.get_user_access_state()->>'state' = 'active_pro'); END $$;
DO $$ BEGIN
  PERFORM public.access_state('f0000000-0000-0000-0000-000000000001');
  PERFORM public.__t('4d. brauzer boshqa uid uchun access_state chaqira olmaydi', false);
EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('4d. brauzer boshqa uid uchun access_state chaqira olmaydi', true); END $$;
RESET ROLE;

-- ── 5. grant_premium + chek ───────────────────────────────────────────────
INSERT INTO public.chek (id, email, chek_link, amount, tariff_days, source)
VALUES ('c0000000-0000-0000-0000-000000000001', 'new@q.uz', 'receipts/x.jpg', 15000, 7, 'telegram');
DO $$ DECLARE r1 jsonb; r2 jsonb; BEGIN
  r1 := public.grant_premium('f0000000-0000-0000-0000-000000000001', 7, 'c0000000-0000-0000-0000-000000000001');
  r2 := public.grant_premium('f0000000-0000-0000-0000-000000000001', 7, 'c0000000-0000-0000-0000-000000000001');
  PERFORM public.__t('5a. chek bilan premium berildi', (r1->>'ok')::boolean);
  PERFORM public.__t('5b. ikkinchi bosish premium BERMAYDI (already_processed)', r2->>'error' = 'already_processed');
  PERFORM public.__t('5c. chek approved, user_id bog''landi',
    (SELECT status = 'approved' AND processed AND user_id = 'f0000000-0000-0000-0000-000000000001' AND premium_until IS NOT NULL
       FROM public.chek WHERE id = 'c0000000-0000-0000-0000-000000000001'));
END $$;
DO $$ DECLARE e1 timestamptz; e2 timestamptz; BEGIN
  SELECT tariff_end_date INTO e1 FROM public.profiles WHERE id = 'f0000000-0000-0000-0000-000000000001';
  PERFORM public.grant_premium('f0000000-0000-0000-0000-000000000001', 30);
  SELECT tariff_end_date INTO e2 FROM public.profiles WHERE id = 'f0000000-0000-0000-0000-000000000001';
  PERFORM public.__t('5d. faol tarif uzaytiriladi (oxiridan +30 kun)', e2 - e1 BETWEEN interval '29 days 23 hours' AND interval '30 days 1 hour');
END $$;
DO $$ BEGIN PERFORM public.__t('5e. noto''g''ri kun rad', public.grant_premium('f0000000-0000-0000-0000-000000000001', 0)->>'error' = 'invalid_input'); END $$;
DO $$ BEGIN PERFORM public.__t('5f. authenticated grant_premium chaqira olmaydi',
  NOT has_function_privilege('authenticated', 'public.grant_premium(uuid,integer,uuid)', 'EXECUTE')); END $$;

SELECT set_config('request.jwt.claim.sub', :F, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('5g. foydalanuvchi o''z chekini ko''radi', (SELECT count(*) FROM public.chek) = 1); END $$;
DO $$ BEGIN
  INSERT INTO public.chek (email, chek_link) VALUES ('new@q.uz', 'soxta');
  PERFORM public.__t('5h. brauzer chek yarata olmaydi', false);
EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('5h. brauzer chek yarata olmaydi', true); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :G, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('5i. boshqa foydalanuvchi chekni ko''rmaydi', (SELECT count(*) FROM public.chek) = 0); END $$;
RESET ROLE;

-- ── 6. Boshqalar ──────────────────────────────────────────────────────────
SELECT set_config('request.jwt.claim.sub', :F, false);
SET ROLE authenticated;
DO $$ BEGIN
  PERFORM public.__t('6a. has_role: boshqa foydalanuvchining admin ekanini bilib bo''lmaydi', NOT public.has_role('f0000000-0000-0000-0000-0000000000ad', 'admin'));
  PERFORM public.__t('6b. has_role: o''zini tekshiradi', NOT public.has_role('f0000000-0000-0000-0000-000000000001', 'admin'));
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :ADM, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('6c. admin o''zining rolini ko''radi', public.has_role('f0000000-0000-0000-0000-0000000000ad', 'admin')); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', false);
DO $$ BEGIN PERFORM public.__t('6d. server (service) har kimni tekshiradi', public.has_role('f0000000-0000-0000-0000-0000000000ad', 'admin')); END $$;
DO $$ BEGIN PERFORM public.__t('6e. check_rate_limit brauzerdan chaqirilmaydi',
  NOT has_function_privilege('anon', 'public.check_rate_limit(text,text,integer,integer)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.check_rate_limit(text,text,integer,integer)', 'EXECUTE')); END $$;
DO $$ BEGIN PERFORM public.__t('6f. receipts bucket yopiq', (SELECT NOT public FROM storage.buckets WHERE id = 'receipts')); END $$;
SET ROLE anon;
DO $$ BEGIN PERFORM public.__t('6g. tariflar hammaga ko''rinadi', (SELECT count(*) FROM public.plans) = 3); END $$;
DO $$ BEGIN
  UPDATE public.plans SET amount = 1;
  PERFORM public.__t('6h. anon narxni o''zgartira olmaydi', false);
EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('6h. anon narxni o''zgartira olmaydi', true); END $$;
RESET ROLE;
DO $$ BEGIN PERFORM public.__t('6i. eski admin jadvali o''chirilgan', to_regclass('public.admin') IS NULL); END $$;
DO $$ BEGIN PERFORM public.__t('6j. served_questions brauzerga yopiq',
  NOT has_table_privilege('authenticated', 'public.served_questions', 'SELECT')); END $$;

DROP FUNCTION public.__t(text, boolean);
