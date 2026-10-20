-- ============================================================
-- Kunlik reja va eslatmalar (Telegram, push-bildirishnoma, kalendar)
-- ============================================================
-- Qoidalar:
--   * Foydalanuvchi eslatma vaqtini tanlaydi (Asia/Tashkent).
--   * Reja: shu vaqtdan boshlab bugun 5 ta test.
--       premium — variantlar (1–63) hisoblanadi;
--       bepul   — "Kunlik reja" sahifasidagi bepul 20 talik testlar (variant = 97).
--     Eslatma vaqtidan OLDIN ishlangan testlar rejaga kirmaydi (eslatma baribir keladi).
--   * Eslatma vaqtida birinchi xabar, keyin har 30 daqiqada — 5/5 bo'lguncha
--     (kuniga ko'pi bilan 8 ta xabar, ya'ni ~3.5 soat).
--   * Yuborishni send-reminders edge funksiyasi bajaradi (pg_cron har 5 daqiqada chaqiradi).
-- Idempotent.

-- ─────────────────────────────────────────────────────────────
-- 1. Jadvallar (hammasi faqat funksiyalar orqali; to'g'ridan-to'g'ri kirish yopiq)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  user_id     uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled     boolean     NOT NULL DEFAULT true,
  remind_time time        NOT NULL,
  telegram    boolean     NOT NULL DEFAULT true,
  push        boolean     NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_links (
  user_id   uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id   bigint      NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_telegram_links_chat ON public.telegram_links (chat_id);

CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token      text        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint   text        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS public.reminder_log (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day          date        NOT NULL,
  sent_count   integer     NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.reminder_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_log         ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reminder_settings, public.telegram_links, public.telegram_link_tokens,
              public.push_subscriptions, public.reminder_log FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Ichki yordamchilar
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.plan_window_start(p_uid uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (((now() AT TIME ZONE 'Asia/Tashkent')::date
           + coalesce((SELECT remind_time FROM public.reminder_settings
                        WHERE user_id = p_uid AND enabled), time '00:00'))
          AT TIME ZONE 'Asia/Tashkent');
$$;

CREATE OR REPLACE FUNCTION public.plan_done_count(p_uid uuid, p_premium boolean)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::integer
    FROM public.test_results
   WHERE user_id = p_uid
     AND created_at >= public.plan_window_start(p_uid)
     AND CASE WHEN p_premium THEN variant BETWEEN 1 AND 63 ELSE variant = 97 END;
$$;

REVOKE ALL ON FUNCTION public.plan_window_start(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.plan_done_count(uuid, boolean) FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Sayt uchun (authenticated)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_plan()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_premium boolean;
  v_set     public.reminder_settings;
  v_start   timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  v_premium := public.is_premium_now(v_uid);
  SELECT * INTO v_set FROM public.reminder_settings WHERE user_id = v_uid;
  v_start := public.plan_window_start(v_uid);

  RETURN jsonb_build_object(
    'ok', true,
    'premium', v_premium,
    'target', 5,
    'done', public.plan_done_count(v_uid, v_premium),
    'window_start', v_start,
    'started', now() >= v_start,
    'reminder', CASE WHEN v_set.user_id IS NULL THEN NULL ELSE jsonb_build_object(
                  'enabled', v_set.enabled,
                  'time', to_char(v_set.remind_time, 'HH24:MI'),
                  'telegram', v_set.telegram,
                  'push', v_set.push) END,
    'telegram_linked', EXISTS (SELECT 1 FROM public.telegram_links WHERE user_id = v_uid),
    'push_devices', (SELECT count(*) FROM public.push_subscriptions WHERE user_id = v_uid)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_time IS NULL OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_time');
  END IF;
  INSERT INTO public.reminder_settings (user_id, enabled, remind_time, telegram, push, updated_at)
  VALUES (v_uid, coalesce(p_enabled, true), p_time::time, coalesce(p_telegram, true), coalesce(p_push, true), now())
  ON CONFLICT (user_id) DO UPDATE
     SET enabled = EXCLUDED.enabled, remind_time = EXCLUDED.remind_time,
         telegram = EXCLUDED.telegram, push = EXCLUDED.push, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Telegram'ni ulash: sayt token oladi, foydalanuvchi t.me/<bot>?start=link_<token> ni ochadi
CREATE OR REPLACE FUNCTION public.create_telegram_link_token()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_token text := md5(gen_random_uuid()::text || clock_timestamp()::text);
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  DELETE FROM public.telegram_link_tokens WHERE user_id = v_uid OR expires_at < now();
  INSERT INTO public.telegram_link_tokens (token, user_id, expires_at)
  VALUES (v_token, v_uid, now() + interval '30 minutes');
  RETURN jsonb_build_object('ok', true, 'token', v_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_telegram()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH d AS (DELETE FROM public.telegram_links WHERE user_id = auth.uid() RETURNING 1)
  SELECT jsonb_build_object('ok', auth.uid() IS NOT NULL);
$$;

CREATE OR REPLACE FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_endpoint IS NULL OR p_endpoint !~ '^https://' OR length(p_endpoint) > 1000
     OR coalesce(length(p_p256dh), 0) NOT BETWEEN 20 AND 200
     OR coalesce(length(p_auth), 0) NOT BETWEEN 8 AND 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_subscription');
  END IF;
  IF (SELECT count(*) FROM public.push_subscriptions WHERE user_id = v_uid AND endpoint <> p_endpoint) >= 5 THEN
    DELETE FROM public.push_subscriptions
     WHERE endpoint = (SELECT endpoint FROM public.push_subscriptions WHERE user_id = v_uid ORDER BY created_at LIMIT 1);
  END IF;
  INSERT INTO public.push_subscriptions (endpoint, user_id, p256dh, auth)
  VALUES (p_endpoint, v_uid, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE SET user_id = v_uid, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_push_subscription(p_endpoint text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH d AS (DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint AND user_id = auth.uid() RETURNING 1)
  SELECT jsonb_build_object('ok', auth.uid() IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.get_daily_plan()                                   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_reminder(boolean, text, boolean, boolean)      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_telegram_link_token()                       FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unlink_telegram()                                  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_push_subscription(text, text, text)           FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_push_subscription(text)                     FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_plan()                                TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_reminder(boolean, text, boolean, boolean)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_telegram_link_token()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_telegram()                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_push_subscription(text, text, text)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_push_subscription(text)                  TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Server uchun (faqat service_role: telegram-bot va send-reminders)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_telegram(p_token text, p_chat_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid;
BEGIN
  DELETE FROM public.telegram_link_tokens
   WHERE token = p_token AND expires_at > now()
  RETURNING user_id INTO v_uid;
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  INSERT INTO public.telegram_links (user_id, chat_id) VALUES (v_uid, p_chat_id)
  ON CONFLICT (user_id) DO UPDATE SET chat_id = EXCLUDED.chat_id, linked_at = now();
  RETURN jsonb_build_object('ok', true,
    'reminder', (SELECT to_char(remind_time, 'HH24:MI') FROM public.reminder_settings WHERE user_id = v_uid AND enabled));
END;
$$;

-- Bot'dagi /stop: shu chatga ulangan hisoblar uchun Telegram eslatmalarini o'chirish
CREATE OR REPLACE FUNCTION public.stop_telegram_reminders(p_chat_id bigint)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH u AS (
    UPDATE public.reminder_settings s SET telegram = false, updated_at = now()
      FROM public.telegram_links l
     WHERE l.chat_id = p_chat_id AND l.user_id = s.user_id
    RETURNING 1)
  SELECT count(*)::integer FROM u;
$$;

-- Hozir eslatma yuborilishi kerak bo'lgan foydalanuvchilar
CREATE OR REPLACE FUNCTION public.due_reminders()
RETURNS TABLE (user_id uuid, done integer, target integer, sent_count integer, chat_id bigint, subscriptions jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH base AS (
    SELECT s.user_id, s.telegram, s.push,
           public.plan_done_count(s.user_id, public.is_premium_now(s.user_id)) AS done,
           coalesce(l.sent_count, 0) AS sent_count
      FROM public.reminder_settings s
      LEFT JOIN public.reminder_log l
        ON l.user_id = s.user_id AND l.day = (now() AT TIME ZONE 'Asia/Tashkent')::date
     WHERE s.enabled
       AND (now() AT TIME ZONE 'Asia/Tashkent')::time >= s.remind_time
       AND coalesce(l.sent_count, 0) < 8
       AND (l.last_sent_at IS NULL OR l.last_sent_at <= now() - interval '29 minutes')
  )
  SELECT b.user_id, b.done, 5, b.sent_count,
         CASE WHEN b.telegram THEN (SELECT t.chat_id FROM public.telegram_links t WHERE t.user_id = b.user_id) END,
         CASE WHEN b.push THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('endpoint', p.endpoint, 'p256dh', p.p256dh, 'auth', p.auth)), '[]'::jsonb)
                                  FROM public.push_subscriptions p WHERE p.user_id = b.user_id)
              ELSE '[]'::jsonb END
    FROM base b
   WHERE b.done < 5;
$$;

CREATE OR REPLACE FUNCTION public.mark_reminder_sent(p_uid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.reminder_log (user_id, day, sent_count, last_sent_at)
  VALUES (p_uid, (now() AT TIME ZONE 'Asia/Tashkent')::date, 1, now())
  ON CONFLICT (user_id, day) DO UPDATE
     SET sent_count = public.reminder_log.sent_count + 1, last_sent_at = now();
$$;

CREATE OR REPLACE FUNCTION public.delete_push_endpoint(p_endpoint text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;

REVOKE ALL ON FUNCTION public.link_telegram(text, bigint)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.stop_telegram_reminders(bigint)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.due_reminders()                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_reminder_sent(uuid)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_push_endpoint(text)          FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_telegram(text, bigint)      TO service_role;
GRANT EXECUTE ON FUNCTION public.stop_telegram_reminders(bigint)  TO service_role;
GRANT EXECUTE ON FUNCTION public.due_reminders()                  TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_reminder_sent(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_push_endpoint(text)       TO service_role;

NOTIFY pgrst, 'reload schema';
