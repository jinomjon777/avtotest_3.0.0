# post-deploy skriptlar

Bu papkadagi SQL fayllar `supabase/migrations/` ga **kirmaydi** — ularni migratsiya bilan birga
avtomatik qo'llamang. Har biri aniq tartibda, qo'lda ishga tushiriladi.

## 001_lock_test_results_writes.sql
**Qachon:** Phase 2 sayti (`submit_test` ni chaqiradigan) Cloudflare'ga deploy bo'lgach va
saytda kamida bitta test ishlab, "Natijalar"da paydo bo'lganini tekshirib bo'lgach.

**Nima qiladi:** `test_results` ga to'g'ridan-to'g'ri INSERT/UPDATE/DELETE ni yopadi.
Natija faqat `submit_test()` orqali yoziladi (hisob javoblarga mos, soatiga 60 tadan ko'p emas).

**Orqaga qaytarish:** kerak bo'lsa (masalan, eski saytga qaytsangiz):
```sql
GRANT INSERT ON public.test_results TO authenticated;
CREATE POLICY "Users can insert own results" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 002_reminders_cron.sql — kunlik eslatmalar jadvali
`send-reminders` funksiyasi deploy qilingandan va `REMINDER_CRON_SECRET` o'rnatilgandan keyin ishga tushiring.
Fayldagi `<SIZNING_SIRINGIZ>` ni o'sha secret qiymati bilan almashtiring. pg_cron har 5 daqiqada funksiyani chaqiradi.
