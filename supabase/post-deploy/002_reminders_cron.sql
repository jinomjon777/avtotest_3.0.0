-- ============================================================
-- POST-DEPLOY 002: kunlik eslatmalarni har 5 daqiqada yuborish (pg_cron + pg_net)
-- ============================================================
-- Avval: 20260807000000_daily_reminders.sql qo'llangan, send-reminders funksiyasi deploy qilingan
-- va REMINDER_CRON_SECRET secret'i o'rnatilgan bo'lishi kerak.
--
-- !!! Pastdagi <SIZNING_SIRINGIZ> ni REMINDER_CRON_SECRET bilan AYNAN BIR XIL qiymatga almashtiring.
-- Idempotent: qayta ishga tushirsangiz eski jadval yozuvi yangilanadi.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'send-reminders';

SELECT cron.schedule(
  'send-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://gbgxfmnfncpigubqnjvd.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<SIZNING_SIRINGIZ>'),
    body    := '{"action":"run"}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- Tekshirish (bir necha daqiqadan keyin):
--   SELECT jobid, status, return_message, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
--   SELECT status_code, content FROM net._http_response ORDER BY created DESC LIMIT 5;
-- O'chirish:
--   SELECT cron.unschedule('send-reminders');
