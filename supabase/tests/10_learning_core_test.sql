-- Phase 2 test to'plami: rollar, RLS, validatsiya, streak, xatolar, zaif mavzular, limitlar.
-- Natija: har bir tekshiruv uchun "PASS | nomi" yoki "FAIL | nomi" (NOTICE).
\set ON_ERROR_STOP 0
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
\set C '''cccccccc-cccc-cccc-cccc-cccccccccccc'''

CREATE OR REPLACE FUNCTION public.__t(name text, cond boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE '% | %', CASE WHEN coalesce(cond,false) THEN 'PASS' ELSE 'FAIL' END, name; END $$;
GRANT EXECUTE ON FUNCTION public.__t(text, boolean) TO anon, authenticated;

INSERT INTO auth.users (id, email) VALUES (:A, 'a@test.uz'), (:B, 'b@test.uz'), (:C, 'c@test.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email) VALUES (:A,'a@test.uz'),(:B,'b@test.uz'),(:C,'c@test.uz') ON CONFLICT DO NOTHING;
SELECT public.__t('3 ta foydalanuvchi + profil yaratildi', (SELECT count(*) FROM public.profiles WHERE id IN (:A,:B,:C)) = 3);

-- ====== 1. ANON: RPC chaqira olmasligi ======
SET ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.submit_test(NULL,1,1,1,10,'[]'::jsonb); PERFORM public.__t('anon submit_test rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon submit_test rad etildi', true); END;
  BEGIN PERFORM public.get_dashboard_stats(); PERFORM public.__t('anon get_dashboard_stats rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon get_dashboard_stats rad etildi', true); END;
  BEGIN PERFORM public.toggle_saved_question('aaaaaaaaaaaaaaaa'); PERFORM public.__t('anon toggle rad etildi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon toggle rad etildi', true); END;
  BEGIN PERFORM 1 FROM public.user_answers; PERFORM public.__t('anon user_answers o''qiy olmaydi', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('anon user_answers o''qiy olmaydi', true); END;
END $$;
RESET ROLE;

-- ====== 2. A: muvaffaqiyatli topshirish (5 javob: 3 to'g'ri, 2 xato) ======
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.submit_test(NULL, 0, 3, 5, 120, jsonb_build_array(
    jsonb_build_object('question_key','1111111111111111','topic_id','3','selected_option',1,'is_correct',true),
    jsonb_build_object('question_key','2222222222222222','topic_id','3','selected_option',2,'is_correct',false),
    jsonb_build_object('question_key','3333333333333333','topic_id','3','selected_option',0,'is_correct',false),
    jsonb_build_object('question_key','4444444444444444','topic_id','5','selected_option',1,'is_correct',true),
    jsonb_build_object('question_key','5555555555555555','topic_id','other','selected_option',3,'is_correct',true)));
  PERFORM public.__t('submit_test ok=true', (r->>'ok')::boolean);
  PERFORM public.__t('answers_saved = 5', (r->>'answers_saved')::int = 5);
  PERFORM public.__t('result_id qaytdi', r->>'result_id' IS NOT NULL);
  RAISE NOTICE 'natija: %', r;
END $$;

-- ====== 3. Noto'g'ri kirishlar: hech narsa yozilmasligi kerak ======
DO $$ DECLARE r jsonb; n0 int; n1 int; ok1 jsonb := jsonb_build_array(jsonb_build_object('question_key','1111111111111111','is_correct',true)); BEGIN
  SELECT count(*) INTO n0 FROM public.user_answers;
  r := public.submit_test(NULL,0,2,5,60, ok1);                       PERFORM public.__t('score_mismatch (2 deb, javobda 1 ta to''g''ri)', r->>'error'='score_mismatch');
  r := public.submit_test(NULL,0,6,5,60,'[]'::jsonb);                PERFORM public.__t('invalid_input: correct > total', r->>'error'='invalid_input');
  r := public.submit_test(NULL,0,0,0,60,'[]'::jsonb);                PERFORM public.__t('invalid_input: total = 0', r->>'error'='invalid_input');
  r := public.submit_test(NULL,0,1,5,100000,'[]'::jsonb);            PERFORM public.__t('invalid_input: vaqt > 24 soat', r->>'error'='invalid_input');
  r := public.submit_test(NULL,101,1,5,10,'[]'::jsonb);              PERFORM public.__t('invalid_input: variant > 100', r->>'error'='invalid_input');
  r := public.submit_test(NULL,0,1,5,10,'{"a":1}'::jsonb);           PERFORM public.__t('invalid_answers: massiv emas', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array(jsonb_build_object('question_key','ABCDEF0123456789','is_correct',true)));
                                                                       PERFORM public.__t('invalid_answers: katta harfli kalit', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array(jsonb_build_object('question_key','abc','is_correct',true)));
                                                                       PERFORM public.__t('invalid_answers: qisqa kalit', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array(jsonb_build_object('question_key','1111111111111111','is_correct','yes')));
                                                                       PERFORM public.__t('invalid_answers: is_correct boolean emas', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array(jsonb_build_object('question_key','1111111111111111','is_correct',true,'selected_option',55)));
                                                                       PERFORM public.__t('invalid_answers: selected_option=55', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array(jsonb_build_object('question_key','1111111111111111','is_correct',true,'topic_id','DROP TABLE')));
                                                                       PERFORM public.__t('invalid_answers: topic_id in''ektsiyasi', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,1,10, ok1 || ok1);                 PERFORM public.__t('invalid_answers: javoblar soni > total', r->>'error'='invalid_answers');
  r := public.submit_test(NULL,0,1,5,10, jsonb_build_array('"matn"'::jsonb)); PERFORM public.__t('invalid_answers: element obyekt emas', r->>'error'='invalid_answers');
  SELECT count(*) INTO n1 FROM public.user_answers;
  PERFORM public.__t('rad etilgan so''rovlar hech narsa yozmadi', n0 = n1);
END $$;

-- ====== 4. To'g'ridan-to'g'ri yozish taqiqlangan ======
DO $$ BEGIN
  BEGIN INSERT INTO public.user_answers (user_id, question_key, is_correct) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','9999999999999999',true); PERFORM public.__t('user_answers INSERT taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('user_answers INSERT taqiqlangan', true); END;
  BEGIN UPDATE public.user_answers SET is_correct = true; PERFORM public.__t('user_answers UPDATE taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('user_answers UPDATE taqiqlangan', true); END;
  BEGIN DELETE FROM public.user_answers; PERFORM public.__t('user_answers DELETE taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('user_answers DELETE taqiqlangan', true); END;
  BEGIN INSERT INTO public.saved_questions (user_id, question_key) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','9999999999999999'); PERFORM public.__t('saved_questions INSERT taqiqlangan', false);
  EXCEPTION WHEN insufficient_privilege THEN PERFORM public.__t('saved_questions INSERT taqiqlangan', true); END;
END $$;

-- ====== 5. RLS: A o'zinikini ko'radi, B ko'rmaydi ======
DO $$ BEGIN PERFORM public.__t('A o''z 5 javobini ko''radi', (SELECT count(*) FROM public.user_answers) = 5); END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :B, false);
SET ROLE authenticated;
DO $$ DECLARE s jsonb; BEGIN
  PERFORM public.__t('B A-ning javoblarini KO''RMAYDI (RLS)', (SELECT count(*) FROM public.user_answers) = 0);
  PERFORM public.__t('B A-ning test_results ini ko''rmaydi', (SELECT count(*) FROM public.test_results) = 0);
  s := public.get_dashboard_stats();
  PERFORM public.__t('B dashboard: 0 test', (s->>'total_tests')::int = 0);
  PERFORM public.__t('B dashboard: readiness NULL', s->'readiness_percent' = 'null'::jsonb);
  PERFORM public.__t('B dashboard: streak 0', (s->>'current_streak')::int = 0 AND (s->>'longest_streak')::int = 0);
  PERFORM public.__t('B mistakes bo''sh', (public.get_my_mistakes()->>'total')::int = 0);
END $$;
RESET ROLE;

-- ====== 6. A: dashboard ======
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ DECLARE s jsonb; BEGIN
  s := public.get_dashboard_stats();
  RAISE NOTICE 'A dashboard: %', s;
  PERFORM public.__t('dashboard: ok', (s->>'ok')::boolean);
  PERFORM public.__t('dashboard: total_tests=1', (s->>'total_tests')::int = 1);
  PERFORM public.__t('dashboard: answered 5 / correct 3 / wrong 2', (s->>'answered_total')::int=5 AND (s->>'correct_total')::int=3 AND (s->>'wrong_total')::int=2);
  PERFORM public.__t('dashboard: accuracy 60.0', (s->>'accuracy_percent')::numeric = 60.0);
  PERFORM public.__t('dashboard: avg_percent 60.0', (s->>'avg_percent')::numeric = 60.0);
  PERFORM public.__t('dashboard: today_done + streak 1', (s->>'today_done')::boolean AND (s->>'current_streak')::int = 1 AND (s->>'longest_streak')::int = 1);
  PERFORM public.__t('dashboard: today_answers 5, goal 20', (s->>'today_answers')::int = 5 AND (s->>'daily_goal')::int = 20);
  PERFORM public.__t('dashboard: readiness 60', (s->>'readiness_percent')::numeric = 60);
  PERFORM public.__t('dashboard: last_results 1 ta', jsonb_array_length(s->'last_results') = 1);
END $$;

-- ====== 7. Xatolar: hal qilinish ======
DO $$ DECLARE m jsonb; r jsonb; BEGIN
  m := public.get_my_mistakes();
  PERFORM public.__t('xatolar: 2 ta hal qilinmagan', (m->>'total')::int = 2);
  r := public.submit_test(NULL,0,1,2,30, jsonb_build_array(
    jsonb_build_object('question_key','2222222222222222','topic_id','3','selected_option',1,'is_correct',true),
    jsonb_build_object('question_key','3333333333333333','topic_id','3','selected_option',2,'is_correct',false)));
  PERFORM public.__t('2-test saqlandi', (r->>'ok')::boolean);
  m := public.get_my_mistakes();
  PERFORM public.__t('xatolar: endi 1 ta hal qilinmagan (2222 hal bo''ldi)', (m->>'total')::int = 1 AND m->'items'->0->>'question_key' = '3333333333333333');
  PERFORM public.__t('xato: wrong_count=2, attempts=2', (m->'items'->0->>'wrong_count')::int = 2 AND (m->'items'->0->>'attempts')::int = 2);
  PERFORM public.__t('xato: oxirgi noto''g''ri variant = 2', (m->'items'->0->>'last_wrong_option')::int = 2);
  m := public.get_my_mistakes(50, 0, false);
  PERFORM public.__t('xatolar (hammasi): 2 ta', (m->>'total')::int = 2);
  PERFORM public.__t('2222 resolved=true, 3333 resolved=false',
    (SELECT bool_and((i->>'resolved')::boolean = (i->>'question_key' = '2222222222222222')) FROM jsonb_array_elements(m->'items') i));
  m := public.get_my_mistakes(1, 1, false);
  PERFORM public.__t('xatolar: sahifalash (limit 1, offset 1)', jsonb_array_length(m->'items') = 1 AND (m->>'total')::int = 2);
  m := public.get_my_mistakes(99999, -5, true);
  PERFORM public.__t('xatolar: limit/offset cheklanadi', (m->>'ok')::boolean);
END $$;

-- ====== 8. Zaif mavzular ======
DO $$ DECLARE w jsonb; t jsonb; BEGIN
  w := public.get_weak_topics();
  RAISE NOTICE 'zaif mavzular: %', w;
  PERFORM public.__t('weak: classified 6, unclassified 1', (w->>'classified_answers')::int = 6 AND (w->>'unclassified_answers')::int = 1);
  PERFORM public.__t('weak: coverage 85.7', (w->>'coverage_percent')::numeric = 85.7);
  SELECT x INTO t FROM jsonb_array_elements(w->'topics') x WHERE x->>'topic_id' = '3';
  PERFORM public.__t('weak: mavzu 3 = 2/5 = 40.0%, enough_data', (t->>'answered')::int=5 AND (t->>'correct')::int=2 AND (t->>'accuracy_percent')::numeric=40.0 AND (t->>'enough_data')::boolean);
  SELECT x INTO t FROM jsonb_array_elements(w->'topics') x WHERE x->>'topic_id' = '5';
  PERFORM public.__t('weak: mavzu 5 = 1/1, enough_data=false', (t->>'answered')::int=1 AND NOT (t->>'enough_data')::boolean);
  PERFORM public.__t('weak: "other" reytingda yo''q', NOT EXISTS (SELECT 1 FROM jsonb_array_elements(w->'topics') x WHERE x->>'topic_id'='other'));
  PERFORM public.__t('weak: ishonchli mavzu birinchi (enough_data tartibi)', w->'topics'->0->>'topic_id' = '3');
END $$;

-- ====== 9. Saqlangan savollar ======
DO $$ DECLARE r jsonb; BEGIN
  r := public.toggle_saved_question('1111111111111111'); PERFORM public.__t('toggle: saqlandi', (r->>'saved')::boolean AND (r->>'count')::int = 1);
  r := public.toggle_saved_question('1111111111111111'); PERFORM public.__t('toggle: olib tashlandi', NOT (r->>'saved')::boolean AND (r->>'count')::int = 0);
  r := public.toggle_saved_question('XYZ');              PERFORM public.__t('toggle: invalid_key', r->>'error' = 'invalid_key');
  r := public.toggle_saved_question(NULL);               PERFORM public.__t('toggle: NULL -> invalid_key', r->>'error' = 'invalid_key');
  PERFORM public.toggle_saved_question('aaaaaaaaaaaaaaaa');
  PERFORM public.__t('saved_questions A o''zini ko''radi', (SELECT count(*) FROM public.saved_questions) = 1);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :B, false);
SET ROLE authenticated;
DO $$ BEGIN PERFORM public.__t('B A-ning saqlanganlarini ko''rmaydi', (SELECT count(*) FROM public.saved_questions) = 0); END $$;
RESET ROLE;
INSERT INTO public.saved_questions (user_id, question_key) SELECT :C, lpad(to_hex(g), 16, '0') FROM generate_series(1, 500) g;
SELECT set_config('request.jwt.claim.sub', :C, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.toggle_saved_question('fffffffffffffff0'); PERFORM public.__t('toggle: 500 limit', r->>'error' = 'limit_reached');
  r := public.toggle_saved_question(lpad(to_hex(1), 16, '0')); PERFORM public.__t('toggle: limitda ham olib tashlash mumkin', NOT (r->>'saved')::boolean AND (r->>'count')::int = 499);
END $$;
RESET ROLE;

-- ====== 10. Streak (kunlar) ======
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at)
SELECT :B, 0, 10, 20, 100, (now() AT TIME ZONE 'Asia/Tashkent')::date - d + time '12:00', now() FROM unnest(ARRAY[1,2]) d;
SELECT set_config('request.jwt.claim.sub', :B, false);
SET ROLE authenticated;
DO $$ DECLARE s jsonb; BEGIN
  s := public.get_dashboard_stats();
  PERFORM public.__t('streak: kecha+undan oldingi -> current 2', (s->>'current_streak')::int = 2 AND (s->>'longest_streak')::int = 2);
  PERFORM public.__t('streak: bugun hali yo''q -> today_done=false', NOT (s->>'today_done')::boolean);
END $$;
RESET ROLE;
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at)
SELECT :B, 0, 10, 20, 100, (now() AT TIME ZONE 'Asia/Tashkent')::date - d + time '12:00', now() FROM unnest(ARRAY[6,7,8,9,10]) d;
SET ROLE authenticated;
DO $$ DECLARE s jsonb; BEGIN
  s := public.get_dashboard_stats();
  PERFORM public.__t('streak: eski uzunroq seriya -> longest 5, current 2', (s->>'longest_streak')::int = 5 AND (s->>'current_streak')::int = 2);
END $$;
RESET ROLE;
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at)
VALUES (:C, 0, 10, 20, 100, (now() AT TIME ZONE 'Asia/Tashkent')::date - 2 + time '12:00', now());
SELECT set_config('request.jwt.claim.sub', :C, false);
SET ROLE authenticated;
DO $$ DECLARE s jsonb; BEGIN
  s := public.get_dashboard_stats();
  PERFORM public.__t('streak: 2 kun oldin -> current 0, longest 1', (s->>'current_streak')::int = 0 AND (s->>'longest_streak')::int = 1);
END $$;
RESET ROLE;
SELECT public.__t('kun chegarasi: 19:30 UTC = ertasi kun 00:30 Toshkent', ('2026-01-01 19:30:00+00'::timestamptz AT TIME ZONE 'Asia/Tashkent')::date = '2026-01-02');

-- ====== 11. Rate limit ======
INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, created_at)
SELECT :C, 0, 1, 2, 5, now(), now() FROM generate_series(1, 60);
SELECT set_config('request.jwt.claim.sub', :C, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; BEGIN
  r := public.submit_test(NULL,0,1,2,5,'[]'::jsonb);
  PERFORM public.__t('rate limit: soatiga 60 tadan keyin rad', r->>'error' = 'rate_limited');
END $$;
RESET ROLE;

-- ====== 12. Mavjud verify_and_save_test_result tekshiruvlari saqlanadi ======
SELECT set_config('request.jwt.claim.sub', :A, false);
SET ROLE authenticated;
DO $$ DECLARE r jsonb; n0 int; n1 int; BEGIN
  SELECT count(*) INTO n0 FROM public.user_answers;
  r := public.submit_test(gen_random_uuid(), 0, 1, 1, 10, jsonb_build_array(jsonb_build_object('question_key','7777777777777777','is_correct',true)));
  RAISE NOTICE 'noma''lum sessiya natijasi: %', r;
  SELECT count(*) INTO n1 FROM public.user_answers;
  PERFORM public.__t('noma''lum sessiya: rad etildi va javoblar yozilmadi', NOT coalesce((r->>'ok')::boolean,false) AND n0 = n1);
END $$;
RESET ROLE;

-- ====== 13. CASCADE: natija o'chsa javoblari ham o'chadi ======
DO $$ DECLARE rid uuid; n int; BEGIN
  SELECT result_id INTO rid FROM public.user_answers WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1;
  DELETE FROM public.test_results WHERE id = rid;
  SELECT count(*) INTO n FROM public.user_answers WHERE result_id = rid;
  PERFORM public.__t('CASCADE: natija o''chsa javoblari ham o''chdi', n = 0);
END $$;

DROP FUNCTION public.__t(text, boolean);
