-- get-questions yordamchilari: sh supabase/tests/run.sh supabase/tests/60_question_access_test.sql
\set A '\'bbbbbbbb-0000-0000-0000-000000000001\''
\set B '\'bbbbbbbb-0000-0000-0000-000000000002\''
INSERT INTO auth.users (id, email) VALUES (:A,'a@q.uz'), (:B,'b@q.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id) VALUES (:A), (:B) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION pg_temp.chk(name text, ok boolean) RETURNS text LANGUAGE sql AS
$$ SELECT CASE WHEN ok THEN 'PASS ' ELSE 'FAIL ' END || name $$;

SELECT set_config('request.jwt.claim.sub', :A, false);
SELECT pg_temp.chk('limitsiz sample rad', NOT public.consume_free_sample(:A::uuid, 'exam'));
SELECT public.claim_free_session('exam');
SELECT pg_temp.chk('sample 1', public.consume_free_sample(:A::uuid, 'exam'));
SELECT public.consume_free_sample(:A::uuid, 'exam'), public.consume_free_sample(:A::uuid, 'exam'), public.consume_free_sample(:A::uuid, 'exam'), public.consume_free_sample(:A::uuid, 'exam');
SELECT pg_temp.chk('sample 6 rad (maks 5)', NOT public.consume_free_sample(:A::uuid, 'exam'));
SELECT pg_temp.chk('boshqa tur rad', NOT public.consume_free_sample(:A::uuid, 'topic'));
SELECT pg_temp.chk('boshqa foydalanuvchi rad', NOT public.consume_free_sample(:B::uuid, 'exam'));

SELECT public.submit_test(NULL, 98, 1, 20, 100, '[{"question_key":"00000000000000aa","topic_id":"1","selected_option":0,"is_correct":true}]'::jsonb);
SELECT public.toggle_saved_question('00000000000000bb');
SELECT pg_temp.chk('owned: javob+saqlangan', public.owned_question_keys(:A::uuid, ARRAY['00000000000000aa','00000000000000bb','00000000000000cc']) @> ARRAY['00000000000000aa','00000000000000bb']
  AND NOT ('00000000000000cc' = ANY (public.owned_question_keys(:A::uuid, ARRAY['00000000000000aa','00000000000000bb','00000000000000cc']))));
SELECT pg_temp.chk('owned: begona foydalanuvchi bo''sh', cardinality(public.owned_question_keys(:B::uuid, ARRAY['00000000000000aa'])) = 0);

SELECT pg_temp.chk('authenticated consume chaqira olmaydi', NOT has_function_privilege('authenticated', 'public.consume_free_sample(uuid,text)', 'EXECUTE'));
SELECT pg_temp.chk('authenticated owned chaqira olmaydi',   NOT has_function_privilege('authenticated', 'public.owned_question_keys(uuid,text[])', 'EXECUTE'));
SELECT pg_temp.chk('service_role consume chaqiradi', has_function_privilege('service_role', 'public.consume_free_sample(uuid,text)', 'EXECUTE'));
SELECT pg_temp.chk('service_role premium tekshiradi', has_function_privilege('service_role', 'public.is_premium_now(uuid)', 'EXECUTE'));
