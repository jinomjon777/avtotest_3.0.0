-- Bepul kunlik limit testlari: sh supabase/tests/run.sh supabase/tests/50_free_limit_test.sql
\set A '\'aaaaaaaa-0000-0000-0000-000000000001\''
\set P '\'aaaaaaaa-0000-0000-0000-000000000002\''
\set T '\'aaaaaaaa-0000-0000-0000-000000000003\''
\set E '\'aaaaaaaa-0000-0000-0000-000000000004\''
INSERT INTO auth.users (id, email) VALUES (:A,'free@t.uz'), (:P,'pro@t.uz'), (:T,'trial@t.uz'), (:E,'exp@t.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id) VALUES (:A), (:P), (:T), (:E) ON CONFLICT DO NOTHING;

ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles SET tariff_days = 30, tariff_start_date = now() - interval '1 day', tariff_end_date = now() + interval '29 days' WHERE id = :P;
UPDATE public.profiles SET is_trial_used = true, trial_end_date = now() + interval '1 day' WHERE id = :T;
UPDATE public.profiles SET tariff_days = 30, tariff_start_date = now() - interval '40 days', tariff_end_date = now() - interval '10 days' WHERE id = :E;
ALTER TABLE public.profiles ENABLE TRIGGER USER;

CREATE OR REPLACE FUNCTION pg_temp.chk(name text, ok boolean) RETURNS text LANGUAGE sql AS
$$ SELECT CASE WHEN ok THEN 'PASS ' ELSE 'FAIL ' END || name $$;

-- bepul
SELECT set_config('request.jwt.claim.sub', :A, false);
SELECT pg_temp.chk('free: 1-mashq ruxsat',      (public.claim_free_session('practice')->>'ok')::boolean);
SELECT pg_temp.chk('free: 2-mashq rad',         public.claim_free_session('practice')->>'error' = 'daily_limit');
SELECT pg_temp.chk('free: imtihon alohida limit',(public.claim_free_session('exam')->>'ok')::boolean);
SELECT pg_temp.chk('free: 2-imtihon rad',       NOT (public.claim_free_session('exam')->>'ok')::boolean);
SELECT pg_temp.chk('free: mavzu 1 ruxsat',      (public.claim_free_session('topic')->>'ok')::boolean);
SELECT pg_temp.chk('free: mavzu 2 rad',         NOT (public.claim_free_session('topic')->>'ok')::boolean);
SELECT pg_temp.chk('free: xatolar 1 ruxsat',    (public.claim_free_session('mistakes')->>'ok')::boolean);
SELECT pg_temp.chk('free: noto''g''ri tur',     public.claim_free_session('hack')->>'error' = 'invalid_kind');
SELECT pg_temp.chk('free: premium=false',       public.claim_free_session('exam')->>'premium' = 'false');
-- ertangi kun: kechagi yozuvni surish
UPDATE public.free_daily_usage SET day = day - 1 WHERE user_id = :A::uuid AND kind = 'practice';
SELECT pg_temp.chk('free: ertasi kuni yana ruxsat', (public.claim_free_session('practice')->>'ok')::boolean);

-- premium va sinov
SELECT set_config('request.jwt.claim.sub', :P, false);
SELECT pg_temp.chk('pro: cheksiz 1', (public.claim_free_session('exam')->>'premium')::boolean);
SELECT pg_temp.chk('pro: cheksiz 2', (public.claim_free_session('exam')->>'ok')::boolean);
SELECT pg_temp.chk('pro: limit yozilmaydi', NOT EXISTS (SELECT 1 FROM public.free_daily_usage WHERE user_id = :P::uuid));
SELECT set_config('request.jwt.claim.sub', :T, false);
SELECT pg_temp.chk('trial: cheksiz', (public.claim_free_session('practice')->>'ok')::boolean AND (public.claim_free_session('practice')->>'ok')::boolean);
SELECT set_config('request.jwt.claim.sub', :E, false);
SELECT pg_temp.chk('muddati o''tgan: 1 ruxsat', (public.claim_free_session('exam')->>'ok')::boolean);
SELECT pg_temp.chk('muddati o''tgan: 2 rad',   NOT (public.claim_free_session('exam')->>'ok')::boolean);

-- anonim va huquqlar
SELECT set_config('request.jwt.claim.sub', '', false);
SELECT pg_temp.chk('anon rad', public.claim_free_session('exam')->>'error' = 'not_authenticated');
SELECT pg_temp.chk('jadval authenticated uchun yopiq', NOT has_table_privilege('authenticated', 'public.free_daily_usage', 'SELECT'));
SELECT pg_temp.chk('is_premium_now tashqaridan yopiq', NOT has_function_privilege('authenticated', 'public.is_premium_now(uuid)', 'EXECUTE'));
SELECT pg_temp.chk('claim authenticated uchun ochiq', has_function_privilege('authenticated', 'public.claim_free_session(text)', 'EXECUTE'));
SELECT pg_temp.chk('claim anon uchun yopiq', NOT has_function_privilege('anon', 'public.claim_free_session(text)', 'EXECUTE'));
