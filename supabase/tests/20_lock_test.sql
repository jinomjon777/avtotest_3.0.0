\set ON_ERROR_STOP 0
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
\set C '''cccccccc-cccc-cccc-cccc-cccccccccccc'''
CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;
INSERT INTO auth.users (id, email) VALUES (:A,'a@t.uz'),(:B,'b@t.uz'),(:C,'c@t.uz') ON CONFLICT DO NOTHING;

-- Qulfdan OLDIN: repodagi FOR ALL siyosati tufayli A o'z natijasini soxtalashtira oladi (muammoning isboti)
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ BEGIN
  INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 20, 20);
  PERFORM public.__t('QULFDAN OLDIN: to''g''ridan-to''g''ri soxta 20/20 yozish mumkin edi (muammo tasdiqlandi)', true);
EXCEPTION WHEN OTHERS THEN PERFORM public.__t('QULFDAN OLDIN: to''g''ridan-to''g''ri yozish', false); END $$;
RESET ROLE;

\ir ../post-deploy/001_lock_test_results_writes.sql
\ir ../post-deploy/001_lock_test_results_writes.sql

-- Qulfdan KEYIN
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ BEGIN
  BEGIN INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 20, 20);
    PERFORM public.__t('qulfdan keyin: INSERT taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('qulfdan keyin: INSERT taqiqlangan', true); END;
  BEGIN UPDATE public.test_results SET correct_answers = 20; PERFORM public.__t('qulfdan keyin: UPDATE taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('qulfdan keyin: UPDATE taqiqlangan', true); END;
  BEGIN DELETE FROM public.test_results; PERFORM public.__t('qulfdan keyin: DELETE taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('qulfdan keyin: DELETE taqiqlangan', true); END;
END $$;
DO $$ DECLARE r jsonb; BEGIN
  r := public.submit_test(NULL, 0, 1, 2, 30, jsonb_build_array(
    jsonb_build_object('question_key','aaaaaaaaaaaaaaa1','topic_id','1','selected_option',0,'is_correct',true),
    jsonb_build_object('question_key','aaaaaaaaaaaaaaa2','topic_id','1','selected_option',1,'is_correct',false)));
  PERFORM public.__t('qulfdan keyin: submit_test ISHLAYDI', (r->>'ok')::boolean);
  PERFORM public.__t('qulfdan keyin: A o''z natijasini ko''radi (SELECT own)', (SELECT count(*) FROM public.test_results) >= 1);
END $$;
RESET ROLE;

-- Admin hamma natijani ko'radi, oddiy foydalanuvchi ko'rmaydi
INSERT INTO public.user_roles (user_id, role) VALUES (:B, 'admin') ON CONFLICT DO NOTHING;
SELECT set_config('request.jwt.claim.sub', :B, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('admin (B) boshqalar natijasini ko''radi', (SELECT count(*) FROM public.test_results) >= 1); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :C, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('oddiy foydalanuvchi (C) boshqalar natijasini ko''rmaydi', (SELECT count(*) FROM public.test_results) = 0); END $$;
RESET ROLE;
DO $$ BEGIN PERFORM public.__t('qulf: faqat SELECT siyosatlari qoldi', NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='test_results' AND cmd <> 'SELECT')); END $$;
DROP FUNCTION public.__t(text, boolean);
