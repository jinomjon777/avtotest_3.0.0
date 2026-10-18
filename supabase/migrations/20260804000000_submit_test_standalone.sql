-- ============================================================
-- submit_test: production'dagi schema drift'ga chidamli versiya
-- ============================================================
-- Muammo: production bazasida `verify_and_save_test_result()` funksiyasi va `test_sessions`
-- jadvali yo'q (20260313000001_access_control.sql u yerda qo'llanmagan). Shu sababli
-- submit_test ichidagi chaqiruv "function does not exist" (42883) xatosini berardi, sayt esa
-- eski usulda faqat natijani yozib, JAVOBLARNI (user_answers) saqlamasdi → "Xatolarim" bo'sh.
--
-- Yechim: sessiyasiz natija (barcha bepul/oddiy testlar, mashq=99, imtihon=98) to'g'ridan-to'g'ri
-- shu funksiya ichida yoziladi. Sessiyali natija faqat verify_and_save_test_result mavjud
-- bo'lsa unga topshiriladi. Funksiya imzosi va javob formati o'zgarmaydi (frontend tegilmaydi).
-- Idempotent: CREATE OR REPLACE.

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

  IF p_session_id IS NOT NULL
     AND to_regprocedure('public.verify_and_save_test_result(uuid,integer,integer,integer,integer)') IS NOT NULL THEN
    -- Sessiyali (premium) natija: mavjud tekshiruv funksiyasi orqali
    EXECUTE 'SELECT public.verify_and_save_test_result($1,$2,$3,$4,$5)'
       INTO v_res
      USING p_session_id, p_variant, p_correct, p_total, p_time_seconds;
    IF NOT coalesce((v_res->>'ok')::boolean, false) THEN
      RETURN v_res;
    END IF;
    v_result_id := (v_res->>'result_id')::uuid;
  ELSE
    -- Sessiyasiz natija (yoki sessiya tizimi bazada yo'q): to'g'ridan-to'g'ri yozish
    INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds)
    VALUES (v_uid, p_variant, p_correct, p_total, p_time_seconds)
    RETURNING id INTO v_result_id;
    v_res := jsonb_build_object('ok', true, 'result_id', v_result_id);
  END IF;

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

REVOKE ALL ON FUNCTION public.submit_test(uuid, integer, integer, integer, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_test(uuid, integer, integer, integer, integer, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
