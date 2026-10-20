-- Kunlik reja va eslatmalar: sh supabase/tests/run.sh supabase/tests/70_reminders_test.sql
\set F '\'cccccccc-0000-0000-0000-000000000001\''
\set P '\'cccccccc-0000-0000-0000-000000000002\''
\set N '\'cccccccc-0000-0000-0000-000000000003\''
INSERT INTO auth.users (id, email) VALUES (:F,'f@r.uz'), (:P,'p@r.uz'), (:N,'n@r.uz') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id) VALUES (:F), (:P), (:N) ON CONFLICT DO NOTHING;
ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles SET tariff_days = 30, tariff_start_date = now() - interval '1 day', tariff_end_date = now() + interval '29 days' WHERE id = :P;
ALTER TABLE public.profiles ENABLE TRIGGER USER;
CREATE OR REPLACE FUNCTION pg_temp.chk(name text, ok boolean) RETURNS text LANGUAGE sql AS
$$ SELECT CASE WHEN ok THEN 'PASS ' ELSE 'FAIL ' END || name $$;
-- eslatma vaqti: hozirdan 1 soat oldin (Toshkent) — oyna boshlangan
CREATE OR REPLACE FUNCTION pg_temp.past_time() RETURNS text LANGUAGE sql AS
$$ SELECT to_char(greatest((now() AT TIME ZONE 'Asia/Tashkent')::time - interval '1 hour', time '00:00'), 'HH24:MI') $$;

-- bepul
SELECT set_config('request.jwt.claim.sub', :F, false);
SELECT pg_temp.chk('vaqt formati tekshiriladi', public.set_reminder(true, '25:00', true, true)->>'error' = 'invalid_time');
SELECT pg_temp.chk('eslatma saqlandi', (public.set_reminder(true, pg_temp.past_time(), true, true)->>'ok')::boolean);
SELECT pg_temp.chk('reja 0/5, bepul', (public.get_daily_plan()->>'done')::int = 0 AND public.get_daily_plan()->>'premium' = 'false');
SELECT public.submit_test(NULL, 97, 15, 20, 600, '[]');
SELECT public.submit_test(NULL, 5, 15, 20, 600, '[]');   -- variant: bepulda hisoblanmaydi
SELECT pg_temp.chk('bepul: faqat 97 hisoblanadi', (public.get_daily_plan()->>'done')::int = 1);
-- eslatma vaqtidan oldingi test hisoblanmaydi
UPDATE public.test_results SET created_at = public.plan_window_start(:F::uuid) - interval '5 minutes' WHERE user_id = :F::uuid AND variant = 97;
SELECT pg_temp.chk('vaqtdan oldingi test kirmaydi', (public.get_daily_plan()->>'done')::int = 0);

-- premium
SELECT set_config('request.jwt.claim.sub', :P, false);
SELECT public.set_reminder(true, pg_temp.past_time(), true, false);
SELECT public.submit_test(NULL, 12, 18, 20, 600, '[]'), public.submit_test(NULL, 97, 18, 20, 600, '[]');
SELECT pg_temp.chk('premium: faqat variantlar', (public.get_daily_plan()->>'done')::int = 1 AND (public.get_daily_plan()->>'premium')::boolean);

-- telegram ulash
SELECT set_config('request.jwt.claim.sub', :F, false);
SELECT public.create_telegram_link_token()->>'token' AS tok \gset
SELECT pg_temp.chk('noto''g''ri token', public.link_telegram('xxx', 111)->>'error' = 'invalid_token');
SELECT pg_temp.chk('ulandi', (public.link_telegram(:'tok', 555)->>'ok')::boolean);
SELECT pg_temp.chk('token bir martalik', public.link_telegram(:'tok', 555)->>'error' = 'invalid_token');
SELECT pg_temp.chk('reja: telegram ulangan', (public.get_daily_plan()->>'telegram_linked')::boolean);

-- push
SELECT pg_temp.chk('push yaroqsiz rad', public.save_push_subscription('http://x', 'a', 'b')->>'error' = 'invalid_subscription');
SELECT pg_temp.chk('push saqlandi', (public.save_push_subscription('https://fcm.googleapis.com/x1', repeat('k', 87), repeat('a', 22))->>'ok')::boolean);
SELECT pg_temp.chk('push qurilma 1', (public.get_daily_plan()->>'push_devices')::int = 1);

-- yuborish navbati
SELECT pg_temp.chk('due: bepul (telegram+push)', EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :F::uuid AND d.chat_id = 555 AND jsonb_array_length(d.subscriptions) = 1));
SELECT pg_temp.chk('due: premium (push o''chiq)', EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :P::uuid AND d.chat_id IS NULL AND d.subscriptions = '[]'::jsonb));
SELECT pg_temp.chk('due: sozlamasiz yo''q', NOT EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :N::uuid));
SELECT public.mark_reminder_sent(:F::uuid);
SELECT pg_temp.chk('30 daqiqa ichida qayta yo''q', NOT EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :F::uuid));
UPDATE public.reminder_log SET last_sent_at = now() - interval '31 minutes' WHERE user_id = :F::uuid;
SELECT pg_temp.chk('31 daqiqadan keyin yana', EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :F::uuid));
UPDATE public.reminder_log SET sent_count = 8 WHERE user_id = :F::uuid;
SELECT pg_temp.chk('kuniga maks 8', NOT EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :F::uuid));
UPDATE public.reminder_log SET sent_count = 1 WHERE user_id = :F::uuid;
SELECT public.submit_test(NULL, 97, 10, 20, 600, '[]') FROM generate_series(1, 5);
SELECT pg_temp.chk('5/5 bo''lgach to''xtaydi', NOT EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :F::uuid));
SELECT pg_temp.chk('/stop telegramni o''chiradi', public.stop_telegram_reminders(555) = 1);
-- kelajakdagi vaqt: hali yubormaydi
SELECT set_config('request.jwt.claim.sub', :N, false);
SELECT public.set_reminder(true, to_char(least((now() AT TIME ZONE 'Asia/Tashkent')::time + interval '1 hour', time '23:59'), 'HH24:MI'), true, true);
SELECT pg_temp.chk('vaqti kelmagan — yo''q', NOT EXISTS (SELECT 1 FROM public.due_reminders() d WHERE d.user_id = :N::uuid) OR (now() AT TIME ZONE 'Asia/Tashkent')::time > time '22:58');

-- huquqlar
SELECT pg_temp.chk('jadval yopiq', NOT has_table_privilege('authenticated', 'public.reminder_settings', 'SELECT'));
SELECT pg_temp.chk('due authenticated uchun yopiq', NOT has_function_privilege('authenticated', 'public.due_reminders()', 'EXECUTE'));
SELECT pg_temp.chk('link_telegram authenticated uchun yopiq', NOT has_function_privilege('authenticated', 'public.link_telegram(text,bigint)', 'EXECUTE'));
SELECT pg_temp.chk('anon get_daily_plan yopiq', NOT has_function_privilege('anon', 'public.get_daily_plan()', 'EXECUTE'));
