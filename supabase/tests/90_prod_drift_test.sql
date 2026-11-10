-- Production sxemasida (supabase/tests/prod/schema.sql) topilgan ochiq joylar yopilganini tekshiradi.
--   sh supabase/tests/run-prod.sh            (production sxemasi + deploy migratsiyalari, 2 marta)
--   sh supabase/tests/run.sh supabase/tests/90_prod_drift_test.sql   (repo migratsiyalari bilan ham o'tishi kerak)
\set ON_ERROR_STOP 0
\set U1 '''d0000000-0000-0000-0000-000000000001'''
\set U2 '''d0000000-0000-0000-0000-000000000002'''
\set ADM '''d0000000-0000-0000-0000-0000000000ad'''
CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;

INSERT INTO auth.users (id, email) VALUES (:U1,'u1@d.uz'), (:U2,'u2@d.uz'), (:ADM,'adm@d.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email) VALUES (:U1,'u1@d.uz'), (:U2,'u2@d.uz'), (:ADM,'adm@d.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role) VALUES (:ADM, 'admin');

-- 1. Admin tekshiruvisiz ochiq RPC'lar yo'q
DO $$ BEGIN
  PERFORM public.__t('1a. admin_delete_user bazada yo''q', to_regprocedure('public.admin_delete_user(uuid)') IS NULL);
  PERFORM public.__t('1b. admin_create_user bazada yo''q', to_regprocedure('public.admin_create_user(text,text,text,text)') IS NULL);
END $$;

-- 2. Boshqalarning profili o'qilmaydi
SET ROLE anon;
DO $$ BEGIN PERFORM public.__t('2a. anon profillarni o''qiy olmaydi', (SELECT count(*) FROM public.profiles) = 0);
EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('2a. anon profillarni o''qiy olmaydi', true); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :U1, false);
SET ROLE authenticated;
DO $$ BEGIN
  PERFORM public.__t('2b. foydalanuvchi faqat o''z profilini ko''radi', (SELECT array_agg(email) FROM public.profiles) = ARRAY['u1@d.uz']);
  PERFORM public.__t('2c. has_role: o''zi admin emas', NOT public.has_role(auth.uid(), 'admin'));
  PERFORM public.__t('2d. has_role: boshqaning rolini bilib bo''lmaydi', NOT public.has_role('d0000000-0000-0000-0000-0000000000ad'::uuid, 'admin'));
  UPDATE public.profiles SET full_name = 'X' WHERE id = 'd0000000-0000-0000-0000-000000000002';
  PERFORM public.__t('2e. boshqaning profilini o''zgartirib bo''lmaydi', (SELECT full_name FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'X');
END $$;
DO $$ BEGIN DELETE FROM public.profiles; PERFORM public.__t('2f. profilni o''chirib bo''lmaydi', false);
EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('2f. profilni o''chirib bo''lmaydi', true); END $$;
DO $$ BEGIN INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin'); PERFORM public.__t('2g. o''ziga admin rolini bera olmaydi', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN PERFORM public.__t('2g. o''ziga admin rolini bera olmaydi', true); END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :ADM, false);
SET ROLE authenticated;
DO $$ BEGIN
  PERFORM public.__t('3a. admin: has_role true', public.has_role(auth.uid(), 'admin'));
  PERFORM public.__t('3b. admin barcha profillarni ko''radi', (SELECT count(*) FROM public.profiles) >= 3);
END $$;
RESET ROLE;

-- 4. Server jadvallari brauzerga yopiq
DO $$
DECLARE t text; bad text[] := '{}';
BEGIN
  FOREACH t IN ARRAY ARRAY['analytics_events','free_daily_usage','push_subscriptions','reminder_log','reminder_settings',
                           'telegram_link_tokens','telegram_links','user_roles','audit_log','payment_methods',
                           'telegram_bot_sessions','user_sessions','device_removals','served_questions','rate_limits']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL AND (
         has_table_privilege('anon', 'public.' || t, 'SELECT, INSERT, UPDATE, DELETE')
      OR has_table_privilege('authenticated', 'public.' || t, 'SELECT, INSERT, UPDATE, DELETE')) THEN
      bad := bad || t;
    END IF;
  END LOOP;
  PERFORM public.__t('4a. server jadvallari brauzerga yopiq: ' || coalesce(nullif(array_to_string(bad, ','), ''), 'ok'), cardinality(bad) = 0);
  PERFORM public.__t('4b. saved_questions/user_answers: brauzer yozolmaydi',
    NOT has_table_privilege('authenticated', 'public.saved_questions', 'INSERT, UPDATE, DELETE')
    AND NOT has_table_privilege('authenticated', 'public.user_answers', 'INSERT, UPDATE, DELETE'));
END $$;

-- 5. Server-only RPC'lar brauzerga yopiq
DO $$
DECLARE f text; bad text[] := '{}';
BEGIN
  FOREACH f IN ARRAY ARRAY['public.access_state(uuid)','public.is_premium_now(uuid)','public.grant_premium(uuid,integer,uuid)',
                           'public.record_served_questions(uuid,text[])','public.owned_question_keys(uuid,text[])',
                           'public.consume_free_sample(uuid,text)','public.check_rate_limit(text,text,integer,integer)',
                           'public.cleanup_rate_limits()','public.due_reminders()','public.link_telegram(text,bigint)',
                           'public.mark_reminder_sent(uuid)','public.stop_telegram_reminders(bigint)',
                           'public.delete_push_endpoint(text)','public.plan_done_count(uuid,boolean)','public.plan_window_start(uuid)']
  LOOP
    IF to_regprocedure(f) IS NOT NULL AND (
         has_function_privilege('anon', f, 'EXECUTE') OR has_function_privilege('authenticated', f, 'EXECUTE')) THEN
      bad := bad || f;
    END IF;
  END LOOP;
  PERFORM public.__t('5. server RPC''lari brauzerga yopiq: ' || coalesce(nullif(array_to_string(bad, ','), ''), 'ok'), cardinality(bad) = 0);
END $$;

-- 6. Cheklar ommaviy emas
DO $$ BEGIN
  PERFORM public.__t('6a. receipts/cheklar bucket yopiq', NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id IN ('receipts','cheklar') AND public));
  PERFORM public.__t('6b. bucket''larni ommaviy o''qish siyosati yo''q', NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND cmd = 'SELECT' AND policyname IN ('receipts_public_read','cheklar_public_read')));
END $$;

-- 7. Hech qanday jadvalda "USING (true)" brauzer siyosati qolmagan (faqat plans — ochiq narxlar)
DO $$ DECLARE bad text; BEGIN
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO bad FROM pg_policies
   WHERE schemaname = 'public' AND qual = 'true' AND NOT roles <@ ARRAY['service_role']::name[];
  PERFORM public.__t('7. USING(true) siyosatlari yo''q: ' || coalesce(bad, 'ok'), bad IS NULL);
END $$;

-- 8. Kerakli obyektlar bor (sayt va edge funksiyalar ishlatadi)
DO $$ BEGIN
  PERFORM public.__t('8a. get_user_access_state', to_regprocedure('public.get_user_access_state()') IS NOT NULL);
  PERFORM public.__t('8b. grant_premium', to_regprocedure('public.grant_premium(uuid,integer,uuid)') IS NOT NULL);
  PERFORM public.__t('8c. plans to''ldirilgan', (SELECT count(*) FROM public.plans) >= 3);
  PERFORM public.__t('8d. served_questions', to_regclass('public.served_questions') IS NOT NULL);
  PERFORM public.__t('8e. user_sessions (user_id, device_id) unikal', EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'user_sessions' AND indexdef ILIKE '%UNIQUE%(user_id, device_id)%'));
  PERFORM public.__t('8f. public.admin jadvali o''chirilgan', to_regclass('public.admin') IS NULL);
END $$;
