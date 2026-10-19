-- ============================================================
-- PHASE 4 — Kunlik faollik (seriya ko'rsatkichi uchun)
-- Faqat QO'SHUVCHI: yangi funksiya. Qayta ishga tushirsa xavfsiz.
-- ============================================================

-- get_recent_activity(): oxirgi p_days kun (Asia/Tashkent) bo'yicha test va javoblar soni.
-- Faollik bo'lmagan kunlar ham (0 bilan) qaytadi — klient 7 kunlik "nuqtalar"ni to'g'ridan-to'g'ri chizadi.
CREATE OR REPLACE FUNCTION public.get_recent_activity(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_days  integer := least(greatest(coalesce(p_days, 7), 1), 60);
  v_today date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_out   jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'day', d.day, 'tests', coalesce(t.n, 0), 'answers', coalesce(a.n, 0)) ORDER BY d.day), '[]'::jsonb)
    INTO v_out
    FROM (SELECT (v_today - g)::date AS day FROM generate_series(0, v_days - 1) AS g) d
    LEFT JOIN (SELECT (completed_at AT TIME ZONE 'Asia/Tashkent')::date AS day, count(*) AS n
                 FROM public.test_results
                WHERE user_id = v_uid AND completed_at > now() - make_interval(days => v_days + 1)
                GROUP BY 1) t ON t.day = d.day
    LEFT JOIN (SELECT (answered_at AT TIME ZONE 'Asia/Tashkent')::date AS day, count(*) AS n
                 FROM public.user_answers
                WHERE user_id = v_uid AND answered_at > now() - make_interval(days => v_days + 1)
                GROUP BY 1) a ON a.day = d.day;

  RETURN jsonb_build_object('ok', true, 'days', v_out);
END;
$$;

REVOKE ALL ON FUNCTION public.get_recent_activity(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_activity(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
