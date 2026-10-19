-- ============================================================
-- Premium savollarga kirish: get-questions edge funksiyasi uchun yordamchi funksiyalar
-- ============================================================
-- Premium fayllar (mavzuli testlar, variantlar) endi public/ da emas, faqat get-questions
-- funksiyasi orqali beriladi. Funksiya service_role bilan quyidagilarni chaqiradi:
--   is_premium_now(uid)                — premiummi (20260805 da yaratilgan)
--   consume_free_sample(uid, kind)     — bepul foydalanuvchi bugungi limitni olganmi va
--                                        shu limit bilan nechta tasodifiy to'plam olgan (maks. 5)
--   owned_question_keys(uid, keys[])   — foydalanuvchi qaysi savollarni allaqachon ko'rgan
--                                        (javob bergan yoki saqlagan) — "Xatolarim" uchun
-- Bu funksiyalar brauzerdan chaqirib bo'lmaydi (faqat service_role).
-- Idempotent.

ALTER TABLE public.free_daily_usage ADD COLUMN IF NOT EXISTS samples integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.consume_free_sample(p_uid uuid, p_kind text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_rows integer;
BEGIN
  UPDATE public.free_daily_usage
     SET samples = samples + 1
   WHERE user_id = p_uid
     AND day = (now() AT TIME ZONE 'Asia/Tashkent')::date
     AND kind = p_kind
     AND samples < 5;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.owned_question_keys(p_uid uuid, p_keys text[])
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(array_agg(DISTINCT k), '{}')
    FROM (
      SELECT question_key AS k FROM public.user_answers
       WHERE user_id = p_uid AND question_key = ANY (p_keys)
      UNION
      SELECT question_key FROM public.saved_questions
       WHERE user_id = p_uid AND question_key = ANY (p_keys)
    ) s;
$$;

REVOKE ALL ON FUNCTION public.consume_free_sample(uuid, text)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owned_question_keys(uuid, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_premium_now(uuid)              FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_free_sample(uuid, text)   TO service_role;
GRANT EXECUTE ON FUNCTION public.owned_question_keys(uuid, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_premium_now(uuid)              TO service_role;

NOTIFY pgrst, 'reload schema';
