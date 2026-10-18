-- ============================================================
-- PHASE 2 — O'quv yadrosi
-- Javoblar tarixi, saqlangan savollar, statistika va natijani server tomonida saqlash.
-- Faqat QO'SHUVCHI migratsiya: mavjud jadval/ma'lumotlar o'zgarmaydi yoki o'chirilmaydi.
-- Qayta ishga tushirsa xavfsiz (idempotent).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES: imtihon sanasi va kunlik maqsad
--    (tarif maydonlari protect_tariff_trigger bilan himoyalangan; bular oddiy sozlamalar)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_date  date,
  ADD COLUMN IF NOT EXISTS daily_goal smallint NOT NULL DEFAULT 20;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_daily_goal_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_daily_goal_check CHECK (daily_goal BETWEEN 5 AND 200);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. USER_ANSWERS: har bir berilgan javob (xatolar va zaif mavzular shu yerdan hisoblanadi)
--    question_key  — src/lib/questionKey.js dagi 16 belgili til-mustaqil kalit
--    topic_id      — public/data/topic_map.json dagi mavzu ('1'..'34', yoki 'other')
--    Yozish FAQAT submit_test() orqali; foydalanuvchi to'g'ridan-to'g'ri yoza olmaydi.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_answers (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
  result_id       uuid                 REFERENCES public.test_results(id) ON DELETE CASCADE,
  question_key    text        NOT NULL CHECK (question_key ~ '^[0-9a-f]{16}$'),
  topic_id        text                 CHECK (topic_id ~ '^[0-9a-z]{1,12}$'),
  selected_option smallint             CHECK (selected_option BETWEEN 0 AND 9),
  is_correct      boolean     NOT NULL,
  answered_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_answers_user_time  ON public.user_answers (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_key   ON public.user_answers (user_id, question_key, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_topic ON public.user_answers (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_result     ON public.user_answers (result_id);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_answers_select_own" ON public.user_answers;
CREATE POLICY "user_answers_select_own"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

-- Chuqur himoya: RLS ustiga jadval huquqlari ham cheklanadi
REVOKE ALL ON public.user_answers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_answers FROM authenticated;
GRANT SELECT ON public.user_answers TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. SAVED_QUESTIONS: "Saqlangan savollarim"
--    Yozish faqat toggle_saved_question() orqali (maksimum 500 ta).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_questions (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key text        NOT NULL CHECK (question_key ~ '^[0-9a-f]{16}$'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_key)
);

ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_questions_select_own" ON public.saved_questions;
CREATE POLICY "saved_questions_select_own"
  ON public.saved_questions FOR SELECT
  USING (auth.uid() = user_id);

REVOKE ALL ON public.saved_questions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.saved_questions FROM authenticated;
GRANT SELECT ON public.saved_questions TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. submit_test(): natija + javoblarni BIR tranzaksiyada saqlaydi
--    Mavjud verify_and_save_test_result() (sessiya, premium muddati, bir martalik sessiya)
--    ni QAYTA YOZMAY o'raydi, ustiga kirish ma'lumotlarini tekshiradi va javoblarni yozadi.
--
--    HALOL CHEKLOV: savol-javob kalitlari statik JSON'da (brauzerda), shuning uchun server
--    "is_correct" ni mustaqil tekshira olmaydi. Server quyidagilarni kafolatlaydi:
--      - hisob o'z-o'zida mos (to'g'ri soni == javoblardagi is_correct soni),
--      - ma'qul chegaralar (<=200 savol, vaqt <=24 soat), soatiga <=60 ta test,
--      - javoblar faqat o'z hisobiga yoziladi.
--    To'liq soxtalashga qarshi himoya faqat serverda javob kalitlari bo'lganda mumkin.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_test(
  p_session_id   uuid,
  p_variant      integer,
  p_correct      integer,
  p_total        integer,
  p_time_seconds integer,
  p_answers      jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_res       jsonb;
  v_result_id uuid;
  v_n         integer;
  v_invalid   integer;
  v_true      integer;
  v_saved     integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_total IS NULL OR p_total < 1 OR p_total > 200
     OR p_correct IS NULL OR p_correct < 0 OR p_correct > p_total
     OR p_variant IS NULL OR p_variant < 0 OR p_variant > 100
     OR (p_time_seconds IS NOT NULL AND (p_time_seconds < 0 OR p_time_seconds > 86400)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  p_answers := coalesce(p_answers, '[]'::jsonb);
  IF jsonb_typeof(p_answers) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
  END IF;
  v_n := jsonb_array_length(p_answers);
  IF v_n > 200 OR v_n > p_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
  END IF;

  IF v_n > 0 THEN
    SELECT count(*) FILTER (WHERE NOT (
             jsonb_typeof(e) = 'object'
             AND jsonb_typeof(e->'question_key') = 'string'
             AND (e->>'question_key') ~ '^[0-9a-f]{16}$'
             AND jsonb_typeof(e->'is_correct') = 'boolean'
             AND (e->'topic_id' IS NULL OR jsonb_typeof(e->'topic_id') = 'null'
                  OR (jsonb_typeof(e->'topic_id') = 'string' AND (e->>'topic_id') ~ '^[0-9a-z]{1,12}$'))
             AND (e->'selected_option' IS NULL OR jsonb_typeof(e->'selected_option') = 'null'
                  OR (jsonb_typeof(e->'selected_option') = 'number' AND (e->>'selected_option') ~ '^[0-9]$'))
           )),
           count(*) FILTER (WHERE e->>'is_correct' = 'true')
      INTO v_invalid, v_true
      FROM jsonb_array_elements(p_answers) AS e;

    IF v_invalid > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
    END IF;
    IF v_true <> p_correct THEN
      RETURN jsonb_build_object('ok', false, 'error', 'score_mismatch');
    END IF;
  END IF;

  -- Suiiste'molga qarshi: soatiga 60 tadan ko'p test emas
  IF (SELECT count(*) FROM public.test_results
       WHERE user_id = v_uid AND created_at > now() - interval '1 hour') >= 60 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  v_res := public.verify_and_save_test_result(p_session_id, p_variant, p_correct, p_total, p_time_seconds);
  IF NOT coalesce((v_res->>'ok')::boolean, false) THEN
    RETURN v_res;
  END IF;
  v_result_id := (v_res->>'result_id')::uuid;

  IF v_n > 0 THEN
    INSERT INTO public.user_answers (user_id, result_id, question_key, topic_id, selected_option, is_correct)
    SELECT v_uid,
           v_result_id,
           e->>'question_key',
           nullif(e->>'topic_id', ''),
           (e->>'selected_option')::smallint,
           (e->>'is_correct') = 'true'
      FROM jsonb_array_elements(p_answers) AS e;
    GET DIAGNOSTICS v_saved = ROW_COUNT;
  END IF;

  RETURN v_res || jsonb_build_object('answers_saved', v_saved);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. toggle_saved_question(): saqlash / saqlashdan olish (maks. 500)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_saved_question(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_key IS NULL OR p_key !~ '^[0-9a-f]{16}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_key');
  END IF;

  DELETE FROM public.saved_questions WHERE user_id = v_uid AND question_key = p_key;
  IF FOUND THEN
    SELECT count(*) INTO v_count FROM public.saved_questions WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', true, 'saved', false, 'count', v_count);
  END IF;

  SELECT count(*) INTO v_count FROM public.saved_questions WHERE user_id = v_uid;
  IF v_count >= 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'limit_reached', 'count', v_count);
  END IF;

  INSERT INTO public.saved_questions (user_id, question_key) VALUES (v_uid, p_key);
  RETURN jsonb_build_object('ok', true, 'saved', true, 'count', v_count + 1);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. get_dashboard_stats(): shaxsiy kabinet uchun yagona so'rov
--    Kun chegarasi: Asia/Tashkent (soat 00:00 da yangi kun).
--    readiness_percent (taxminiy ko'rsatkich): oxirgi 10 testning o'rtacha foizi (60%)
--    + oxirgi 200 javob aniqligi (40%). Javoblar bo'lmasa — faqat testlar.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_today      date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_tests      integer;
  v_avg        numeric;
  v_best       numeric;
  v_avg_time   numeric;
  v_last       jsonb;
  v_ans_total  integer;
  v_ans_ok     integer;
  v_recent_avg numeric;
  v_recent_acc numeric;
  v_cur        integer;
  v_longest    integer;
  v_today_done boolean;
  v_today_ans  integer;
  v_goal       smallint;
  v_exam       date;
  v_ready      numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT count(*),
         round(avg(100.0 * correct_answers / nullif(total_questions, 0)), 1),
         round(max(100.0 * correct_answers / nullif(total_questions, 0)), 1),
         round(avg(time_taken_seconds))
    INTO v_tests, v_avg, v_best, v_avg_time
    FROM public.test_results WHERE user_id = v_uid;

  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'completed_at') DESC), '[]'::jsonb) INTO v_last FROM (
    SELECT jsonb_build_object(
             'id', id, 'variant', variant, 'correct', correct_answers, 'total', total_questions,
             'percent', round(100.0 * correct_answers / nullif(total_questions, 0), 1),
             'time_seconds', time_taken_seconds, 'completed_at', completed_at) AS x
      FROM public.test_results WHERE user_id = v_uid
     ORDER BY completed_at DESC LIMIT 5) t;

  SELECT count(*), count(*) FILTER (WHERE is_correct)
    INTO v_ans_total, v_ans_ok FROM public.user_answers WHERE user_id = v_uid;

  SELECT round(avg(p), 1) INTO v_recent_avg FROM (
    SELECT 100.0 * correct_answers / nullif(total_questions, 0) AS p
      FROM public.test_results WHERE user_id = v_uid ORDER BY completed_at DESC LIMIT 10) r;

  SELECT round(100.0 * count(*) FILTER (WHERE is_correct) / nullif(count(*), 0), 1) INTO v_recent_acc FROM (
    SELECT is_correct FROM public.user_answers WHERE user_id = v_uid ORDER BY answered_at DESC, id DESC LIMIT 200) a;

  -- Ketma-ket kunlar (streak): kunda kamida bitta test
  WITH d AS (
    SELECT DISTINCT (completed_at AT TIME ZONE 'Asia/Tashkent')::date AS day
      FROM public.test_results WHERE user_id = v_uid),
  g AS (SELECT day, day - (row_number() OVER (ORDER BY day))::integer AS grp FROM d),
  isl AS (SELECT min(day) AS s, max(day) AS e, count(*)::integer AS len FROM g GROUP BY grp)
  SELECT coalesce(max(len), 0),
         coalesce(max(len) FILTER (WHERE e >= v_today - 1), 0),
         coalesce(bool_or(e = v_today), false)
    INTO v_longest, v_cur, v_today_done FROM isl;

  SELECT count(*) INTO v_today_ans FROM public.user_answers
   WHERE user_id = v_uid AND (answered_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT daily_goal, exam_date INTO v_goal, v_exam FROM public.profiles WHERE id = v_uid;

  v_ready := CASE
    WHEN v_tests = 0 THEN NULL
    WHEN v_recent_acc IS NULL THEN v_recent_avg
    ELSE round(0.6 * v_recent_avg + 0.4 * v_recent_acc, 0)
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'total_tests', v_tests,
    'avg_percent', v_avg,
    'best_percent', v_best,
    'avg_time_seconds', v_avg_time,
    'answered_total', v_ans_total,
    'correct_total', v_ans_ok,
    'wrong_total', v_ans_total - v_ans_ok,
    'accuracy_percent', CASE WHEN v_ans_total > 0 THEN round(100.0 * v_ans_ok / v_ans_total, 1) END,
    'readiness_percent', v_ready,
    'current_streak', v_cur,
    'longest_streak', v_longest,
    'today_done', v_today_done,
    'today_answers', v_today_ans,
    'daily_goal', coalesce(v_goal, 20),
    'exam_date', v_exam,
    'days_to_exam', CASE WHEN v_exam IS NOT NULL THEN (v_exam - v_today) END,
    'saved_count', (SELECT count(*) FROM public.saved_questions WHERE user_id = v_uid),
    'last_results', v_last
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. get_my_mistakes(): "Mening xatolarim"
--    Xato = kamida bir marta noto'g'ri javob berilgan savol.
--    Hal qilingan = ENG OXIRGI javob to'g'ri bo'lgan savol.
--    Savol matni serverda yo'q (statik JSON) — faqat kalit qaytadi, matnni klient topadi.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_mistakes(
  p_limit           integer DEFAULT 50,
  p_offset          integer DEFAULT 0,
  p_only_unresolved boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_lim   integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_off   integer := greatest(coalesce(p_offset, 0), 0);
  v_total integer;
  v_items jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  WITH agg AS (
    SELECT question_key,
           (array_agg(topic_id        ORDER BY answered_at DESC, id DESC))[1] AS topic_id,
           count(*)                                                           AS attempts,
           count(*) FILTER (WHERE NOT is_correct)                             AS wrong_count,
           max(answered_at) FILTER (WHERE NOT is_correct)                     AS last_wrong_at,
           (array_agg(is_correct      ORDER BY answered_at DESC, id DESC))[1] AS last_is_correct,
           (array_agg(selected_option ORDER BY answered_at DESC, id DESC) FILTER (WHERE NOT is_correct))[1] AS last_wrong_option
      FROM public.user_answers
     WHERE user_id = v_uid
     GROUP BY question_key
    HAVING count(*) FILTER (WHERE NOT is_correct) > 0
  ), f AS (
    SELECT * FROM agg WHERE NOT coalesce(p_only_unresolved, true) OR NOT last_is_correct
  )
  SELECT (SELECT count(*) FROM f),
         coalesce(jsonb_agg(jsonb_build_object(
           'question_key', question_key, 'topic_id', topic_id,
           'attempts', attempts, 'wrong_count', wrong_count,
           'last_wrong_at', last_wrong_at, 'last_wrong_option', last_wrong_option,
           'resolved', last_is_correct) ORDER BY last_wrong_at DESC), '[]'::jsonb)
    INTO v_total, v_items
    FROM (SELECT * FROM f ORDER BY last_wrong_at DESC LIMIT v_lim OFFSET v_off) x;

  RETURN jsonb_build_object('ok', true, 'total', v_total, 'items', v_items);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 8. get_weak_topics(): mavzular bo'yicha aniqlik (oxirgi p_days kun)
--    Mavzusi aniqlanmagan ('other' yoki NULL) javoblar reytingga kirmaydi, lekin
--    `unclassified_answers` va `coverage_percent` orqali ochiq ko'rsatiladi.
--    p_min_answers dan kam javobli mavzu enough_data=false (ishonchsiz) deb belgilanadi.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_weak_topics(
  p_days        integer DEFAULT 120,
  p_min_answers integer DEFAULT 5
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_days   integer := least(greatest(coalesce(p_days, 120), 1), 3650);
  v_min    integer := least(greatest(coalesce(p_min_answers, 5), 1), 100);
  v_topics jsonb;
  v_class  integer;
  v_uncl   integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT count(*) FILTER (WHERE topic_id IS NOT NULL AND topic_id <> 'other'),
         count(*) FILTER (WHERE topic_id IS NULL OR topic_id = 'other')
    INTO v_class, v_uncl
    FROM public.user_answers
   WHERE user_id = v_uid AND answered_at > now() - make_interval(days => v_days);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'topic_id', topic_id, 'answered', answered, 'correct', correct,
           'accuracy_percent', round(100.0 * correct / answered, 1),
           'enough_data', answered >= v_min)
         ORDER BY (answered >= v_min) DESC, (100.0 * correct / answered) ASC, answered DESC), '[]'::jsonb)
    INTO v_topics
    FROM (SELECT topic_id, count(*) AS answered, count(*) FILTER (WHERE is_correct) AS correct
            FROM public.user_answers
           WHERE user_id = v_uid AND topic_id IS NOT NULL AND topic_id <> 'other'
             AND answered_at > now() - make_interval(days => v_days)
           GROUP BY topic_id) t;

  RETURN jsonb_build_object(
    'ok', true,
    'topics', v_topics,
    'classified_answers', v_class,
    'unclassified_answers', v_uncl,
    'coverage_percent', CASE WHEN v_class + v_uncl > 0 THEN round(100.0 * v_class / (v_class + v_uncl), 1) END
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 9. Funksiya huquqlari: faqat tizimga kirgan foydalanuvchilar chaqira oladi
-- ─────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.submit_test(uuid, integer, integer, integer, integer, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_saved_question(text)                                   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_dashboard_stats()                                          FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_mistakes(integer, integer, boolean)                     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_weak_topics(integer, integer)                              FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_test(uuid, integer, integer, integer, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_saved_question(text)                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats()                                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_mistakes(integer, integer, boolean)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weak_topics(integer, integer)                              TO authenticated;

-- PostgREST sxema keshini yangilash (aks holda yangi RPC'lar "topilmadi" deb chiqishi mumkin)
NOTIFY pgrst, 'reload schema';
