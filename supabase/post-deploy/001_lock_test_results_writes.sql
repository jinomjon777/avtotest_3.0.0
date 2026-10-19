-- ============================================================
-- POST-DEPLOY 001: test_results ga to'g'ridan-to'g'ri yozishni yopish
-- ============================================================
-- !!! FAQAT yangi sayt (submit_test RPC'ni chaqiradigan useTestResults.ts) deploy qilingandan
-- !!! KEYIN ishga tushiring. Aks holda eski (kesh'dagi) sayt natijalarni saqlay olmaydi.
--
-- Nima uchun: hozir foydalanuvchi o'z test natijasini brauzerdan to'g'ridan-to'g'ri qo'sha
-- (repoda `test_results_own` FOR ALL siyosati bor — hatto tahrirlash/o'chirish ham mumkin),
-- ya'ni soxta ball yuborish ochiq. Bu skriptdan keyin natija FAQAT submit_test() orqali yoziladi.
--
-- Production'da va repoda siyosat nomlari farq qilgani uchun (schema drift), nom bo'yicha emas,
-- TURI bo'yicha tozalanadi. Idempotent: qayta ishga tushirish xavfsiz.

DO $$
DECLARE r record;
BEGIN
  -- 1) Yozish huquqi beruvchi barcha siyosatlarni olib tashlash
  FOR r IN SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'test_results'
              AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.test_results', r.policyname);
    RAISE NOTICE 'olib tashlandi: %', r.policyname;
  END LOOP;

  -- 2) O'z natijalarini o'qish (FOR ALL siyosati bilan birga ketgan bo'lishi mumkin)
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'test_results'
                    AND cmd = 'SELECT' AND qual ILIKE '%auth.uid() = user_id%') THEN
    CREATE POLICY "test_results_select_own" ON public.test_results
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- 3) Admin barcha natijalarni o'qishi (production'da bor, repoda yo'q edi)
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'test_results'
                    AND policyname = 'test_results_admin_read') THEN
    CREATE POLICY "test_results_admin_read" ON public.test_results
      FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Chuqur himoya: jadval huquqlari ham olinadi (service_role va SECURITY DEFINER funksiyalar ta'sirlanmaydi)
REVOKE INSERT, UPDATE, DELETE ON public.test_results FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
