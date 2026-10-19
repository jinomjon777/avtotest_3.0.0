-- ============================================================
-- Bepul foydalanuvchilar uchun kunlik limit: mashq / mavzu mashqi / xatolar mashqi / imtihon
-- ============================================================
-- Qoida: premium (faol tarif yoki faol sinov muddati) — cheksiz.
--        bepul — har bir turdan kuniga 1 marta (kun chegarasi: Asia/Tashkent).
-- Limit sessiya BOSHLANGANDA olinadi (natija saqlanganda emas), aks holda sahifani
-- yangilab cheksiz ishlash mumkin bo'lardi.
-- Premium ta'rifi src/hooks/useAccessState.ts bilan bir xil.
-- Idempotent: qayta ishga tushirish xavfsiz.

CREATE TABLE IF NOT EXISTS public.free_daily_usage (
  user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day      date        NOT NULL,
  kind     text        NOT NULL CHECK (kind IN ('practice', 'topic', 'mistakes', 'exam')),
  used_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, kind)
);

ALTER TABLE public.free_daily_usage ENABLE ROW LEVEL SECURITY;
-- Siyosat yo'q: jadvalga faqat quyidagi SECURITY DEFINER funksiyalar orqali murojaat qilinadi.
REVOKE ALL ON public.free_daily_usage FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Foydalanuvchi hozir premiummi (faol tarif yoki faol sinov)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_premium_now(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((
    SELECT (coalesce(p.tariff_days, 0) > 0 AND p.tariff_end_date IS NOT NULL AND p.tariff_end_date > now())
        OR (coalesce(p.is_trial_used, false) AND p.trial_end_date IS NOT NULL AND p.trial_end_date > now())
      FROM public.profiles p
     WHERE p.id = p_uid
  ), false);
$$;
REVOKE ALL ON FUNCTION public.is_premium_now(uuid) FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Sessiyani boshlashdan oldin chaqiriladi.
--   premium        → {ok:true, premium:true}
--   bepul, bugun 1-marta → {ok:true, premium:false}   (limit band qilinadi)
--   bepul, limit tugagan → {ok:false, error:'daily_limit', premium:false}
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_free_session(p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_day  date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_rows integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('practice', 'topic', 'mistakes', 'exam') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;

  IF public.is_premium_now(v_uid) THEN
    RETURN jsonb_build_object('ok', true, 'premium', true);
  END IF;

  INSERT INTO public.free_daily_usage (user_id, day, kind)
  VALUES (v_uid, v_day, p_kind)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 1 THEN
    RETURN jsonb_build_object('ok', true, 'premium', false);
  END IF;
  RETURN jsonb_build_object('ok', false, 'error', 'daily_limit', 'premium', false);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_free_session(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_free_session(text) TO authenticated;

-- Eski yozuvlarni tozalash shart emas (kuniga ko'pi bilan 4 qator / foydalanuvchi),
-- lekin xohlasangiz: DELETE FROM public.free_daily_usage WHERE day < current_date - 30;

NOTIFY pgrst, 'reload schema';
