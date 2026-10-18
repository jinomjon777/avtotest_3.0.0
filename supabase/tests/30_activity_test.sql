-- Phase 4 test: get_recent_activity()
\set ON_ERROR_STOP 0
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;
INSERT INTO auth.users (id, email) VALUES (:A,'a@test.uz'),(:B,'b@test.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email) VALUES (:A,'a@test.uz'),(:B,'b@test.uz') ON CONFLICT DO NOTHING;

-- anon rad etiladi
SET ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.get_recent_activity(7); PERFORM public.__t('anon get_recent_activity rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon get_recent_activity rad etildi', true); END;
END $$;
RESET ROLE;

-- A: bugun 2 test, kecha 1 test, 3 kun oldin 1 test; B: bugun 1 test (A ko'rmasligi kerak)
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at) VALUES
 (:A,0,10,20,100, now(), now()),
 (:A,0,12,20,100, now(), now()),
 (:A,0,15,20,100, now() - interval '1 day', now() - interval '1 day'),
 (:A,0,18,20,100, now() - interval '3 days', now() - interval '3 days'),
 (:B,0,20,20,100, now(), now());

SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; d jsonb; BEGIN
  r := public.get_recent_activity(7);
  d := r->'days';
  PERFORM public.__t('ok = true', (r->>'ok')::boolean);
  PERFORM public.__t('7 kun qaytdi (nol kunlar bilan)', jsonb_array_length(d) = 7);
  PERFORM public.__t('oxirgi element = bugun, 2 test (B ning testi kirmaydi)', (d->6->>'tests')::int = 2);
  PERFORM public.__t('kecha = 1 test', (d->5->>'tests')::int = 1);
  PERFORM public.__t('faolsiz kun = 0', (d->4->>'tests')::int = 0);
  PERFORM public.__t('3 kun oldin = 1 test', (d->3->>'tests')::int = 1);
  PERFORM public.__t('kunlar o''sish tartibida', (d->0->>'day')::date < (d->6->>'day')::date);
  PERFORM public.__t('p_days 1000 -> 60 ga cheklanadi', jsonb_array_length(public.get_recent_activity(1000)->'days') = 60);
  PERFORM public.__t('p_days 0 -> 1 ga cheklanadi', jsonb_array_length(public.get_recent_activity(0)->'days') = 1);
END $$;
RESET ROLE;
