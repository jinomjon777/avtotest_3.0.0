-- Phase 11 test: track_event() va get_admin_analytics()
\set ON_ERROR_STOP 0
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
\set C '''cccccccc-cccc-cccc-cccc-cccccccccccc'''
\set D '''dddddddd-dddd-dddd-dddd-dddddddddddd'''
CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;

INSERT INTO auth.users (id, email) VALUES (:A,'a@test.uz'),(:B,'b@test.uz'),(:C,'c@test.uz'),(:D,'d@test.uz') ON CONFLICT DO NOTHING;
-- profiles qatorlari auth.users trigger'i orqali avtomatik yaratiladi; test uchun qiymatlarni yangilaymiz
ALTER TABLE public.profiles DISABLE TRIGGER protect_tariff_trigger;
UPDATE public.profiles SET created_at = now() - interval '10 days' WHERE id = :C;
UPDATE public.profiles SET tariff_days = 30, tariff_start_date = now(), tariff_end_date = now() + interval '30 days' WHERE id = :D;
ALTER TABLE public.profiles ENABLE TRIGGER protect_tariff_trigger;
INSERT INTO public.user_roles (user_id, role) VALUES (:A, 'admin') ON CONFLICT DO NOTHING;

-- anon rad etiladi
SET ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.get_admin_analytics(30); PERFORM public.__t('anon get_admin_analytics rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon get_admin_analytics rad etildi', true); END;
  BEGIN PERFORM public.track_event('test_start'); PERFORM public.__t('anon track_event rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon track_event rad etildi', true); END;
END $$;
RESET ROLE;

-- Faollik ma'lumotlari
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at) VALUES
 (:A, 0, 10, 20, 100, now(), now()),
 (:A, 98, 18, 20, 100, now(), now()),
 (:C, 5, 15, 20, 100, now() - interval '9 days', now() - interval '9 days');
INSERT INTO public.user_answers (user_id, question_key, topic_id, is_correct, answered_at)
SELECT :B, 'aaaaaaaaaaaaaaaa', '1', g > 4, now() FROM generate_series(1, 5) g;   -- 4 xato, 1 to'g'ri
INSERT INTO public.user_answers (user_id, question_key, topic_id, is_correct, answered_at)
SELECT :B, 'bbbbbbbbbbbbbbbb', '2', true, now() FROM generate_series(1, 5) g;

-- Oddiy foydalanuvchi (B): track_event ishlaydi, admin hisoboti yopiq
SELECT set_config('request.jwt.claim.sub', :B, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.get_admin_analytics(30);
  PERFORM public.__t('admin bo''lmagan foydalanuvchi: forbidden', r->>'error' = 'forbidden' AND (r->>'ok')::boolean = false);
  PERFORM public.__t('noma''lum hodisa nomi rad etiladi', public.track_event('hack')->>'error' = 'invalid_event');
  BEGIN PERFORM 1 FROM public.analytics_events; PERFORM public.__t('analytics_events ni to''g''ridan-to''g''ri o''qib bo''lmaydi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('analytics_events ni to''g''ridan-to''g''ri o''qib bo''lmaydi', true); END;
END $$;
RESET ROLE;

-- Admin (A): hodisa yozadi va hisobotni oladi
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; s jsonb; BEGIN
  PERFORM public.__t('track_event test_start ok', (public.track_event('test_start')->>'ok')::boolean);
  PERFORM public.__t('5 soniya ichida takror yozilmaydi', (public.track_event('test_start')->>'skipped')::boolean);
  PERFORM public.__t('track_event exam_start ok', (public.track_event('exam_start')->>'ok')::boolean);
  r := public.get_admin_analytics(30);
  PERFORM public.__t('ok = true', (r->>'ok')::boolean);
  PERFORM public.__t('DAU = 2 (A test, B javob)', (r->'users'->>'dau')::int = 2);
  PERFORM public.__t('MAU = 3 (A, B, C)', (r->'users'->>'mau')::int = 3);
  PERFORM public.__t('jami foydalanuvchi = 4', (r->'users'->>'total')::int = 4);
  PERFORM public.__t('davrdagi yangi foydalanuvchi = 4', (r->'users'->>'new_in_period')::int = 4);
  PERFORM public.__t('premium = 1 (25.0%)', (r->'users'->>'premium_total')::int = 1 AND (r->'users'->>'premium_pct')::numeric = 25.0);
  PERFORM public.__t('yangi premium = 1', (r->'users'->>'new_premium_in_period')::int = 1);
  PERFORM public.__t('yakunlangan testlar = 3 (oddiy 1... C ning varianti 5 -> oddiy 2)', (r->'tests'->>'finished')::int = 3 AND (r->'tests'->>'regular')::int = 2 AND (r->'tests'->>'exam')::int = 1);
  PERFORM public.__t('o''rtacha natija 71.7', (r->'tests'->>'avg_percent')::numeric = 71.7);
  PERFORM public.__t('boshlanishlar: test 1, imtihon 1', (r->'starts'->>'test')::int = 1 AND (r->'starts'->>'exam')::int = 1);
  PERFORM public.__t('D1 retention: 1/1', (r->'retention'->'d1'->>'cohort')::int = 1 AND (r->'retention'->'d1'->>'retained')::int = 1);
  PERFORM public.__t('D7 retention: 1/0', (r->'retention'->'d7'->>'cohort')::int = 1 AND (r->'retention'->'d7'->>'retained')::int = 0);
  PERFORM public.__t('seriya = 30 kun, oxirgi kun faol = 2', jsonb_array_length(r->'series') = 30 AND (r->'series'->29->>'active_users')::int = 2);
  PERFORM public.__t('eng qiyin savol: 80% xato (4/5)', r->'hard_questions'->0->>'question_key' = 'aaaaaaaaaaaaaaaa' AND (r->'hard_questions'->0->>'wrong_pct')::numeric = 80.0);
  PERFORM public.__t('qiyin savollar 2 ta (5 dan kam javobli yo''q)', jsonb_array_length(r->'hard_questions') = 2);
  PERFORM public.__t('eng qiyin mavzu: "1" (10 dan kam javob chiqarib tashlanadi)', jsonb_array_length(r->'hard_topics') = 0);
  PERFORM public.__t('p_days 1000 -> 90 ga, 0 -> 7 ga cheklanadi', (public.get_admin_analytics(1000)->>'days')::int = 90 AND (public.get_admin_analytics(0)->>'days')::int = 7);
END $$;
RESET ROLE;
