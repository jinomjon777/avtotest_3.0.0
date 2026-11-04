# post-deploy skriptlar

Bu papkadagi SQL fayllar `supabase/migrations/` ga **kirmaydi**: ularda loyihaga xos maxfiy qiymat bor.
Qo'lda, bir marta ishga tushiriladi.

## 002_reminders_cron.sql — kunlik eslatmalar jadvali
`send-reminders` funksiyasi (`--no-verify-jwt`) deploy qilingandan va `REMINDER_CRON_SECRET` o'rnatilgandan keyin.
Fayldagi `<SIZNING_SIRINGIZ>` ni secret qiymati bilan, URL'dagi loyiha identifikatorini o'zingizniki bilan almashtiring.
pg_cron har 5 daqiqada funksiyani chaqiradi.

> Avvalgi `001_lock_test_results_writes.sql` endi `migrations/20261104000000_security_hardening.sql` ichida.
