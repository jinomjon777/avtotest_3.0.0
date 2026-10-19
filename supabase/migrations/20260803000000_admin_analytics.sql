-- ============================================================
-- PHASE 11 — Analytics (admin uchun)
-- Faqat QO'SHUVCHI: yangi jadval, indeks va 2 ta funksiya. Qayta ishga tushirsa xavfsiz.
-- Kun chegarasi: Asia/Tashkent.
-- ============================================================

-- 1) Test boshlanishi hodisalari (yakunlanishlar test_results dan olinadi)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL CHECK (name IN ('test_start', 'exam_start', 'practice_start')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_time      ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON public.analytics_events (user_id, created_at DESC);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_events FROM PUBLIC, anon, authenticated;

-- Butun bazadagi "eng ko'p xato qilinadigan savollar" so'rovi uchun
CREATE INDEX IF NOT EXISTS idx_user_answers_time ON public.user_answers (answered_at);

-- 2) track_event(): foydalanuvchi o'zi uchun hodisa yozadi (faqat ruxsat etilgan nomlar; 5 soniyada takror yozilmaydi)
CREATE OR REPLACE FUNCTION public.track_event(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  IF p_name IS NULL OR p_name NOT IN ('test_start', 'exam_start', 'practice_start') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_event');
  END IF;
  IF EXISTS (SELECT 1 FROM public.analytics_events
              WHERE user_id = v_uid AND name = p_name AND created_at > now() - interval '5 seconds') THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;
  INSERT INTO public.analytics_events (user_id, name) VALUES (v_uid, p_name);
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.track_event(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_event(text) TO authenticated;

-- 3) get_admin_analytics(): faqat admin. "Faol foydalanuvchi" = shu kuni test yakunlagan, savolga javob bergan
--    yoki test boshlagan foydalanuvchi. "Premium" = hozir amal qilayotgan tarif (tugash sanasi kelajakda).
CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_days  integer := least(greatest(coalesce(p_days, 30), 7), 90);
  v_today date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_from  date;
  v_out   jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  v_from := v_today - (v_days - 1);

  WITH act AS (                       -- (foydalanuvchi, kun) faollik, so'nggi v_days + 8 kun
    SELECT DISTINCT user_id, day FROM (
      SELECT user_id, (completed_at AT TIME ZONE 'Asia/Tashkent')::date AS day FROM public.test_results
       WHERE completed_at >= (v_from - 8)::timestamp AT TIME ZONE 'Asia/Tashkent'
      UNION ALL
      SELECT user_id, (answered_at AT TIME ZONE 'Asia/Tashkent')::date FROM public.user_answers
       WHERE answered_at >= (v_from - 8)::timestamp AT TIME ZONE 'Asia/Tashkent'
      UNION ALL
      SELECT user_id, (created_at AT TIME ZONE 'Asia/Tashkent')::date FROM public.analytics_events
       WHERE created_at >= (v_from - 8)::timestamp AT TIME ZONE 'Asia/Tashkent'
    ) s
  ),
  series AS (
    SELECT d.day,
           (SELECT count(*) FROM act a WHERE a.day = d.day) AS active_users,
           (SELECT count(*) FROM public.profiles p WHERE (p.created_at AT TIME ZONE 'Asia/Tashkent')::date = d.day) AS new_users,
           (SELECT count(*) FROM public.test_results t WHERE (t.completed_at AT TIME ZONE 'Asia/Tashkent')::date = d.day) AS tests
      FROM (SELECT (v_from + g)::date AS day FROM generate_series(0, v_days - 1) g) d
  ),
  coh1 AS (
    SELECT p.id, (p.created_at AT TIME ZONE 'Asia/Tashkent')::date AS cday FROM public.profiles p
     WHERE (p.created_at AT TIME ZONE 'Asia/Tashkent')::date BETWEEN v_from AND v_today - 1
  ),
  coh7 AS (
    SELECT p.id, (p.created_at AT TIME ZONE 'Asia/Tashkent')::date AS cday FROM public.profiles p
     WHERE (p.created_at AT TIME ZONE 'Asia/Tashkent')::date BETWEEN v_from AND v_today - 7
  ),
  fin AS (
    SELECT count(*) FILTER (WHERE variant NOT IN (98, 99)) AS test_n,
           count(*) FILTER (WHERE variant = 98)           AS exam_n,
           count(*) FILTER (WHERE variant = 99)           AS practice_n,
           count(*)                                       AS all_n,
           round(avg(100.0 * correct_answers / nullif(total_questions, 0)), 1) AS avg_pct
      FROM public.test_results
     WHERE completed_at >= v_from::timestamp AT TIME ZONE 'Asia/Tashkent'
  ),
  st AS (
    SELECT count(*) FILTER (WHERE name = 'test_start')     AS test_n,
           count(*) FILTER (WHERE name = 'exam_start')     AS exam_n,
           count(*) FILTER (WHERE name = 'practice_start') AS practice_n
      FROM public.analytics_events
     WHERE created_at >= v_from::timestamp AT TIME ZONE 'Asia/Tashkent'
  ),
  hq AS (
    SELECT question_key, max(topic_id) AS topic_id, count(*) AS answers,
           count(*) FILTER (WHERE NOT is_correct) AS wrong,
           round(100.0 * count(*) FILTER (WHERE NOT is_correct) / count(*), 1) AS wrong_pct
      FROM public.user_answers
     WHERE answered_at >= v_from::timestamp AT TIME ZONE 'Asia/Tashkent'
     GROUP BY question_key HAVING count(*) >= 5
     ORDER BY wrong_pct DESC, answers DESC LIMIT 20
  ),
  ht AS (
    SELECT coalesce(topic_id, 'other') AS topic_id, count(*) AS answers,
           count(*) FILTER (WHERE NOT is_correct) AS wrong,
           round(100.0 * count(*) FILTER (WHERE NOT is_correct) / count(*), 1) AS wrong_pct
      FROM public.user_answers
     WHERE answered_at >= v_from::timestamp AT TIME ZONE 'Asia/Tashkent'
     GROUP BY 1 HAVING count(*) >= 10
     ORDER BY wrong_pct DESC, answers DESC LIMIT 15
  )
  SELECT jsonb_build_object(
    'ok', true,
    'days', v_days,
    'generated_at', now(),
    'users', jsonb_build_object(
      'total',       (SELECT count(*) FROM public.profiles),
      'new_in_period', (SELECT coalesce(sum(new_users), 0) FROM series),
      'dau',         (SELECT count(*) FROM act WHERE day = v_today),
      'wau',         (SELECT count(DISTINCT user_id) FROM act WHERE day > v_today - 7),
      'mau',         (SELECT count(DISTINCT user_id) FROM act WHERE day > v_today - 30),
      'premium_total', (SELECT count(*) FROM public.profiles WHERE (tariff_days > 0 AND coalesce(tariff_end_date, tariff_start_date + make_interval(days => tariff_days)) > now())),
      'premium_pct',   (SELECT round(100.0 * count(*) FILTER (WHERE (tariff_days > 0 AND coalesce(tariff_end_date, tariff_start_date + make_interval(days => tariff_days)) > now())) / nullif(count(*), 0), 1) FROM public.profiles),
      'new_premium_in_period', (SELECT count(*) FROM public.profiles
                                 WHERE tariff_days > 0 AND tariff_start_date >= v_from::timestamp AT TIME ZONE 'Asia/Tashkent')
    ),
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'active_users', active_users,
                 'new_users', new_users, 'tests', tests) ORDER BY day), '[]'::jsonb) FROM series),
    'tests', (SELECT jsonb_build_object('finished', all_n, 'regular', test_n, 'exam', exam_n,
                 'practice', practice_n, 'avg_percent', avg_pct) FROM fin),
    'starts', (SELECT jsonb_build_object('test', test_n, 'exam', exam_n, 'practice', practice_n) FROM st),
    'retention', jsonb_build_object(
      'd1', jsonb_build_object(
        'cohort',   (SELECT count(*) FROM coh1),
        'retained', (SELECT count(*) FROM coh1 c WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = c.id AND a.day = c.cday + 1))),
      'd7', jsonb_build_object(
        'cohort',   (SELECT count(*) FROM coh7),
        'retained', (SELECT count(*) FROM coh7 c WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = c.id AND a.day = c.cday + 7)))),
    'hard_questions', (SELECT coalesce(jsonb_agg(to_jsonb(hq)), '[]'::jsonb) FROM hq),
    'hard_topics',    (SELECT coalesce(jsonb_agg(to_jsonb(ht)), '[]'::jsonb) FROM ht)
  ) INTO v_out;

  RETURN v_out;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
