-- Production (gbgxfmnfncpigubqnjvd) public sxemasining TUZILISHI, 2026-11-10 holati (pg_dump --schema-only, ma'lumotsiz).
-- Faqat test uchun: deploy migratsiyalari haqiqiy production sxemasida (schema drift bilan) ishlashini tekshiradi.
-- Yangilash: .github/workflows/db-schema.yml (vaqtinchalik) yoki pg_dump --schema-only -n public.
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Ubuntu 17.11-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: admin_create_user(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_user(p_email text, p_password text, p_name text DEFAULT NULL::text, p_username text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
declare
  v_user_id uuid;
  v_exists  boolean;
begin
  select exists(select 1 from auth.users where email = p_email) into v_exists;
  if v_exists then
    return jsonb_build_object('error', 'Bu email allaqachon ro''yxatda bor');
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', coalesce(p_name, '')),
    false,
    false,
    now(), now()
  );

  -- Identity yaratish
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    p_email,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    now(), now(), now()
  );

  -- Profile yaratish
  insert into public.profiles (id, email, full_name, username, created_at)
  values (v_user_id, p_email, p_name, p_username, now())
  on conflict (id) do update
    set full_name = p_name, username = p_username;

  return jsonb_build_object('id', v_user_id, 'email', p_email);
end;
$$;


--
-- Name: admin_delete_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_user(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- profiles dan o'chir (cascade auth.users ham o'chadi)
  delete from auth.users where id = p_user_id;
  return jsonb_build_object('deleted', true);
end;
$$;


--
-- Name: claim_free_session(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_free_session(p_kind text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: consume_free_sample(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_free_sample(p_uid uuid, p_kind text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: create_telegram_link_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_telegram_link_token() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: delete_push_endpoint(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_push_endpoint(p_endpoint text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;


--
-- Name: delete_push_subscription(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_push_subscription(p_endpoint text) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  WITH d AS (DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint AND user_id = auth.uid() RETURNING 1)
  SELECT jsonb_build_object('ok', auth.uid() IS NOT NULL);
$$;


--
-- Name: due_reminders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.due_reminders() RETURNS TABLE(user_id uuid, done integer, target integer, sent_count integer, chat_id bigint, subscriptions jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_admin_analytics(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_daily_plan(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_daily_plan() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_dashboard_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_stats() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_today      date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_tests      integer;
  v_avg        numeric;
  v_best       numeric;
  v_avg_time   numeric;
  v_last       jsonb;
  v_ans_total  integer;
  v_ans_ok     integer;
  v_recent_avg numeric;
  v_recent_acc numeric;
  v_cur        integer;
  v_longest    integer;
  v_today_done boolean;
  v_today_ans  integer;
  v_goal       smallint;
  v_exam       date;
  v_ready      numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT count(*),
         round(avg(100.0 * correct_answers / nullif(total_questions, 0)), 1),
         round(max(100.0 * correct_answers / nullif(total_questions, 0)), 1),
         round(avg(time_taken_seconds))
    INTO v_tests, v_avg, v_best, v_avg_time
    FROM public.test_results WHERE user_id = v_uid;

  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'completed_at') DESC), '[]'::jsonb) INTO v_last FROM (
    SELECT jsonb_build_object(
             'id', id, 'variant', variant, 'correct', correct_answers, 'total', total_questions,
             'percent', round(100.0 * correct_answers / nullif(total_questions, 0), 1),
             'time_seconds', time_taken_seconds, 'completed_at', completed_at) AS x
      FROM public.test_results WHERE user_id = v_uid
     ORDER BY completed_at DESC LIMIT 5) t;

  SELECT count(*), count(*) FILTER (WHERE is_correct)
    INTO v_ans_total, v_ans_ok FROM public.user_answers WHERE user_id = v_uid;

  SELECT round(avg(p), 1) INTO v_recent_avg FROM (
    SELECT 100.0 * correct_answers / nullif(total_questions, 0) AS p
      FROM public.test_results WHERE user_id = v_uid ORDER BY completed_at DESC LIMIT 10) r;

  SELECT round(100.0 * count(*) FILTER (WHERE is_correct) / nullif(count(*), 0), 1) INTO v_recent_acc FROM (
    SELECT is_correct FROM public.user_answers WHERE user_id = v_uid ORDER BY answered_at DESC, id DESC LIMIT 200) a;

  -- Ketma-ket kunlar (streak): kunda kamida bitta test
  WITH d AS (
    SELECT DISTINCT (completed_at AT TIME ZONE 'Asia/Tashkent')::date AS day
      FROM public.test_results WHERE user_id = v_uid),
  g AS (SELECT day, day - (row_number() OVER (ORDER BY day))::integer AS grp FROM d),
  isl AS (SELECT min(day) AS s, max(day) AS e, count(*)::integer AS len FROM g GROUP BY grp)
  SELECT coalesce(max(len), 0),
         coalesce(max(len) FILTER (WHERE e >= v_today - 1), 0),
         coalesce(bool_or(e = v_today), false)
    INTO v_longest, v_cur, v_today_done FROM isl;

  SELECT count(*) INTO v_today_ans FROM public.user_answers
   WHERE user_id = v_uid AND (answered_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT daily_goal, exam_date INTO v_goal, v_exam FROM public.profiles WHERE id = v_uid;

  v_ready := CASE
    WHEN v_tests = 0 THEN NULL
    WHEN v_recent_acc IS NULL THEN v_recent_avg
    ELSE round(0.6 * v_recent_avg + 0.4 * v_recent_acc, 0)
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'total_tests', v_tests,
    'avg_percent', v_avg,
    'best_percent', v_best,
    'avg_time_seconds', v_avg_time,
    'answered_total', v_ans_total,
    'correct_total', v_ans_ok,
    'wrong_total', v_ans_total - v_ans_ok,
    'accuracy_percent', CASE WHEN v_ans_total > 0 THEN round(100.0 * v_ans_ok / v_ans_total, 1) END,
    'readiness_percent', v_ready,
    'current_streak', v_cur,
    'longest_streak', v_longest,
    'today_done', v_today_done,
    'today_answers', v_today_ans,
    'daily_goal', coalesce(v_goal, 20),
    'exam_date', v_exam,
    'days_to_exam', CASE WHEN v_exam IS NOT NULL THEN (v_exam - v_today) END,
    'saved_count', (SELECT count(*) FROM public.saved_questions WHERE user_id = v_uid),
    'last_results', v_last
  );
END;
$$;


--
-- Name: get_my_mistakes(integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_mistakes(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_only_unresolved boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_lim   integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_off   integer := greatest(coalesce(p_offset, 0), 0);
  v_total integer;
  v_items jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  WITH agg AS (
    SELECT question_key,
           (array_agg(topic_id        ORDER BY answered_at DESC, id DESC))[1] AS topic_id,
           count(*)                                                           AS attempts,
           count(*) FILTER (WHERE NOT is_correct)                             AS wrong_count,
           max(answered_at) FILTER (WHERE NOT is_correct)                     AS last_wrong_at,
           (array_agg(is_correct      ORDER BY answered_at DESC, id DESC))[1] AS last_is_correct,
           (array_agg(selected_option ORDER BY answered_at DESC, id DESC) FILTER (WHERE NOT is_correct))[1] AS last_wrong_option
      FROM public.user_answers
     WHERE user_id = v_uid
     GROUP BY question_key
    HAVING count(*) FILTER (WHERE NOT is_correct) > 0
  ), f AS (
    SELECT * FROM agg WHERE NOT coalesce(p_only_unresolved, true) OR NOT last_is_correct
  )
  SELECT (SELECT count(*) FROM f),
         coalesce(jsonb_agg(jsonb_build_object(
           'question_key', question_key, 'topic_id', topic_id,
           'attempts', attempts, 'wrong_count', wrong_count,
           'last_wrong_at', last_wrong_at, 'last_wrong_option', last_wrong_option,
           'resolved', last_is_correct) ORDER BY last_wrong_at DESC), '[]'::jsonb)
    INTO v_total, v_items
    FROM (SELECT * FROM f ORDER BY last_wrong_at DESC LIMIT v_lim OFFSET v_off) x;

  RETURN jsonb_build_object('ok', true, 'total', v_total, 'items', v_items);
END;
$$;


--
-- Name: get_recent_activity(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_recent_activity(p_days integer DEFAULT 7) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_weak_topics(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_weak_topics(p_days integer DEFAULT 120, p_min_answers integer DEFAULT 5) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_days   integer := least(greatest(coalesce(p_days, 120), 1), 3650);
  v_min    integer := least(greatest(coalesce(p_min_answers, 5), 1), 100);
  v_topics jsonb;
  v_class  integer;
  v_uncl   integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT count(*) FILTER (WHERE topic_id IS NOT NULL AND topic_id <> 'other'),
         count(*) FILTER (WHERE topic_id IS NULL OR topic_id = 'other')
    INTO v_class, v_uncl
    FROM public.user_answers
   WHERE user_id = v_uid AND answered_at > now() - make_interval(days => v_days);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'topic_id', topic_id, 'answered', answered, 'correct', correct,
           'accuracy_percent', round(100.0 * correct / answered, 1),
           'enough_data', answered >= v_min)
         ORDER BY (answered >= v_min) DESC, (100.0 * correct / answered) ASC, answered DESC), '[]'::jsonb)
    INTO v_topics
    FROM (SELECT topic_id, count(*) AS answered, count(*) FILTER (WHERE is_correct) AS correct
            FROM public.user_answers
           WHERE user_id = v_uid AND topic_id IS NOT NULL AND topic_id <> 'other'
             AND answered_at > now() - make_interval(days => v_days)
           GROUP BY topic_id) t;

  RETURN jsonb_build_object(
    'ok', true,
    'topics', v_topics,
    'classified_answers', v_class,
    'unclassified_answers', v_uncl,
    'coverage_percent', CASE WHEN v_class + v_uncl > 0 THEN round(100.0 * v_class / (v_class + v_uncl), 1) END
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, created_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


--
-- Name: has_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;


--
-- Name: is_premium_now(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_premium_now(p_uid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT coalesce((
    SELECT (coalesce(p.tariff_days, 0) > 0 AND p.tariff_end_date IS NOT NULL AND p.tariff_end_date > now())
        OR (coalesce(p.is_trial_used, false) AND p.trial_end_date IS NOT NULL AND p.trial_end_date > now())
      FROM public.profiles p
     WHERE p.id = p_uid
  ), false);
$$;


--
-- Name: link_telegram(text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_telegram(p_token text, p_chat_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: mark_reminder_sent(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_reminder_sent(p_uid uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  INSERT INTO public.reminder_log (user_id, day, sent_count, last_sent_at)
  VALUES (p_uid, (now() AT TIME ZONE 'Asia/Tashkent')::date, 1, now())
  ON CONFLICT (user_id, day) DO UPDATE
     SET sent_count = public.reminder_log.sent_count + 1, last_sent_at = now();
$$;


--
-- Name: owned_question_keys(uuid, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.owned_question_keys(p_uid uuid, p_keys text[]) RETURNS text[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: plan_done_count(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plan_done_count(p_uid uuid, p_premium boolean) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT count(*)::integer
    FROM public.test_results
   WHERE user_id = p_uid
     AND created_at >= public.plan_window_start(p_uid)
     AND CASE WHEN p_premium THEN variant BETWEEN 1 AND 63 ELSE variant = 97 END;
$$;


--
-- Name: plan_window_start(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plan_window_start(p_uid uuid) RETURNS timestamp with time zone
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT (((now() AT TIME ZONE 'Asia/Tashkent')::date
           + coalesce((SELECT remind_time FROM public.reminder_settings
                        WHERE user_id = p_uid AND enabled), time '00:00'))
          AT TIME ZONE 'Asia/Tashkent');
$$;


--
-- Name: save_push_subscription(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: set_reminder(boolean, text, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
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
$_$;


--
-- Name: stop_telegram_reminders(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.stop_telegram_reminders(p_chat_id bigint) RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  WITH u AS (
    UPDATE public.reminder_settings s SET telegram = false, updated_at = now()
      FROM public.telegram_links l
     WHERE l.chat_id = p_chat_id AND l.user_id = s.user_id
    RETURNING 1)
  SELECT count(*)::integer FROM u;
$$;


--
-- Name: submit_test(uuid, integer, integer, integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_test(p_session_id uuid, p_variant integer, p_correct integer, p_total integer, p_time_seconds integer, p_answers jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
DECLARE
  v_uid       uuid := auth.uid();
  v_res       jsonb;
  v_result_id uuid;
  v_n         integer;
  v_invalid   integer;
  v_true      integer;
  v_saved     integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_total IS NULL OR p_total < 1 OR p_total > 200
     OR p_correct IS NULL OR p_correct < 0 OR p_correct > p_total
     OR p_variant IS NULL OR p_variant < 0 OR p_variant > 100
     OR (p_time_seconds IS NOT NULL AND (p_time_seconds < 0 OR p_time_seconds > 86400)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  p_answers := coalesce(p_answers, '[]'::jsonb);
  IF jsonb_typeof(p_answers) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
  END IF;
  v_n := jsonb_array_length(p_answers);
  IF v_n > 200 OR v_n > p_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
  END IF;

  IF v_n > 0 THEN
    SELECT count(*) FILTER (WHERE NOT (
             jsonb_typeof(e) = 'object'
             AND jsonb_typeof(e->'question_key') = 'string'
             AND (e->>'question_key') ~ '^[0-9a-f]{16}$'
             AND jsonb_typeof(e->'is_correct') = 'boolean'
             AND (e->'topic_id' IS NULL OR jsonb_typeof(e->'topic_id') = 'null'
                  OR (jsonb_typeof(e->'topic_id') = 'string' AND (e->>'topic_id') ~ '^[0-9a-z]{1,12}$'))
             AND (e->'selected_option' IS NULL OR jsonb_typeof(e->'selected_option') = 'null'
                  OR (jsonb_typeof(e->'selected_option') = 'number' AND (e->>'selected_option') ~ '^[0-9]$'))
           )),
           count(*) FILTER (WHERE e->>'is_correct' = 'true')
      INTO v_invalid, v_true
      FROM jsonb_array_elements(p_answers) AS e;

    IF v_invalid > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_answers');
    END IF;
    IF v_true <> p_correct THEN
      RETURN jsonb_build_object('ok', false, 'error', 'score_mismatch');
    END IF;
  END IF;

  -- Suiiste'molga qarshi: soatiga 60 tadan ko'p test emas
  IF (SELECT count(*) FROM public.test_results
       WHERE user_id = v_uid AND created_at > now() - interval '1 hour') >= 60 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  IF p_session_id IS NOT NULL
     AND to_regprocedure('public.verify_and_save_test_result(uuid,integer,integer,integer,integer)') IS NOT NULL THEN
    -- Sessiyali (premium) natija: mavjud tekshiruv funksiyasi orqali
    EXECUTE 'SELECT public.verify_and_save_test_result($1,$2,$3,$4,$5)'
       INTO v_res
      USING p_session_id, p_variant, p_correct, p_total, p_time_seconds;
    IF NOT coalesce((v_res->>'ok')::boolean, false) THEN
      RETURN v_res;
    END IF;
    v_result_id := (v_res->>'result_id')::uuid;
  ELSE
    -- Sessiyasiz natija (yoki sessiya tizimi bazada yo'q): to'g'ridan-to'g'ri yozish
    INSERT INTO public.test_results (user_id, variant, correct_answers, total_questions, time_taken_seconds)
    VALUES (v_uid, p_variant, p_correct, p_total, p_time_seconds)
    RETURNING id INTO v_result_id;
    v_res := jsonb_build_object('ok', true, 'result_id', v_result_id);
  END IF;

  IF v_n > 0 THEN
    INSERT INTO public.user_answers (user_id, result_id, question_key, topic_id, selected_option, is_correct)
    SELECT v_uid,
           v_result_id,
           e->>'question_key',
           nullif(e->>'topic_id', ''),
           (e->>'selected_option')::smallint,
           (e->>'is_correct') = 'true'
      FROM jsonb_array_elements(p_answers) AS e;
    GET DIAGNOSTICS v_saved = ROW_COUNT;
  END IF;

  RETURN v_res || jsonb_build_object('answers_saved', v_saved);
END;
$_$;


--
-- Name: toggle_saved_question(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.toggle_saved_question(p_key text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
DECLARE
  v_uid   uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_key IS NULL OR p_key !~ '^[0-9a-f]{16}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_key');
  END IF;

  DELETE FROM public.saved_questions WHERE user_id = v_uid AND question_key = p_key;
  IF FOUND THEN
    SELECT count(*) INTO v_count FROM public.saved_questions WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', true, 'saved', false, 'count', v_count);
  END IF;

  SELECT count(*) INTO v_count FROM public.saved_questions WHERE user_id = v_uid;
  IF v_count >= 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'limit_reached', 'count', v_count);
  END IF;

  INSERT INTO public.saved_questions (user_id, question_key) VALUES (v_uid, p_key);
  RETURN jsonb_build_object('ok', true, 'saved', true, 'count', v_count + 1);
END;
$_$;


--
-- Name: track_event(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_event(p_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: unlink_telegram(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unlink_telegram() RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  WITH d AS (DELETE FROM public.telegram_links WHERE user_id = auth.uid() RETURNING 1)
  SELECT jsonb_build_object('ok', auth.uid() IS NOT NULL);
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    login text NOT NULL,
    parol text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT analytics_events_name_check CHECK ((name = ANY (ARRAY['test_start'::text, 'exam_start'::text, 'practice_start'::text])))
);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.analytics_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: chek; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chek (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    chek_link text,
    amount integer,
    days integer,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    tariff_days integer,
    processed boolean DEFAULT false NOT NULL,
    source text DEFAULT 'web'::text NOT NULL,
    telegram_chat_id bigint,
    telegram_username text
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_method text,
    phone text,
    telegram_username text,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    subject text DEFAULT ''::text NOT NULL
);


--
-- Name: free_daily_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.free_daily_usage (
    user_id uuid NOT NULL,
    day date NOT NULL,
    kind text NOT NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL,
    samples integer DEFAULT 0 NOT NULL,
    CONSTRAINT free_daily_usage_kind_check CHECK ((kind = ANY (ARRAY['practice'::text, 'topic'::text, 'mistakes'::text, 'exam'::text])))
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    username text,
    email text,
    avatar_url text,
    tariff_days integer DEFAULT 0,
    tariff_start_date timestamp with time zone,
    tariff_end_date timestamp with time zone,
    is_trial_used boolean DEFAULT false,
    trial_end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    exam_date date,
    daily_goal smallint DEFAULT 20 NOT NULL,
    CONSTRAINT profiles_daily_goal_check CHECK (((daily_goal >= 5) AND (daily_goal <= 200)))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    endpoint text NOT NULL,
    user_id uuid NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reminder_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_log (
    user_id uuid NOT NULL,
    day date NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    last_sent_at timestamp with time zone
);


--
-- Name: reminder_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_settings (
    user_id uuid NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    remind_time time without time zone NOT NULL,
    telegram boolean DEFAULT true NOT NULL,
    push boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_questions (
    user_id uuid NOT NULL,
    question_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT saved_questions_question_key_check CHECK ((question_key ~ '^[0-9a-f]{16}$'::text))
);


--
-- Name: telegram_bot_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_bot_sessions (
    chat_id bigint NOT NULL,
    username text,
    first_name text,
    step text DEFAULT 'idle'::text NOT NULL,
    plan_days integer,
    plan_amount bigint,
    site_email text,
    receipt_file_id text,
    receipt_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: telegram_link_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_link_tokens (
    token text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: telegram_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_links (
    user_id uuid NOT NULL,
    chat_id bigint NOT NULL,
    linked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    variant integer,
    correct_answers integer,
    total_questions integer DEFAULT 30,
    time_taken_seconds integer,
    passed boolean,
    answers jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_answers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    result_id uuid,
    question_key text NOT NULL,
    topic_id text,
    selected_option smallint,
    is_correct boolean NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_answers_question_key_check CHECK ((question_key ~ '^[0-9a-f]{16}$'::text)),
    CONSTRAINT user_answers_selected_option_check CHECK (((selected_option >= 0) AND (selected_option <= 9))),
    CONSTRAINT user_answers_topic_id_check CHECK ((topic_id ~ '^[0-9a-z]{1,12}$'::text))
);


--
-- Name: user_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_answers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id text NOT NULL,
    device_info text,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin admin_login_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_login_key UNIQUE (login);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: chek chek_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chek
    ADD CONSTRAINT chek_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: free_daily_usage free_daily_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_daily_usage
    ADD CONSTRAINT free_daily_usage_pkey PRIMARY KEY (user_id, day, kind);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (endpoint);


--
-- Name: reminder_log reminder_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_pkey PRIMARY KEY (user_id, day);


--
-- Name: reminder_settings reminder_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings
    ADD CONSTRAINT reminder_settings_pkey PRIMARY KEY (user_id);


--
-- Name: saved_questions saved_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_questions
    ADD CONSTRAINT saved_questions_pkey PRIMARY KEY (user_id, question_key);


--
-- Name: telegram_bot_sessions telegram_bot_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_bot_sessions
    ADD CONSTRAINT telegram_bot_sessions_pkey PRIMARY KEY (chat_id);


--
-- Name: telegram_link_tokens telegram_link_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_link_tokens
    ADD CONSTRAINT telegram_link_tokens_pkey PRIMARY KEY (token);


--
-- Name: telegram_links telegram_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_links
    ADD CONSTRAINT telegram_links_pkey PRIMARY KEY (user_id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: user_answers user_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_device_id_key UNIQUE (user_id, device_id);


--
-- Name: idx_analytics_events_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_time ON public.analytics_events USING btree (created_at);


--
-- Name: idx_analytics_events_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user_time ON public.analytics_events USING btree (user_id, created_at DESC);


--
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_telegram_links_chat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telegram_links_chat ON public.telegram_links USING btree (chat_id);


--
-- Name: idx_user_answers_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_answers_result ON public.user_answers USING btree (result_id);


--
-- Name: idx_user_answers_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_answers_time ON public.user_answers USING btree (answered_at);


--
-- Name: idx_user_answers_user_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_answers_user_key ON public.user_answers USING btree (user_id, question_key, answered_at DESC);


--
-- Name: idx_user_answers_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_answers_user_time ON public.user_answers USING btree (user_id, answered_at DESC);


--
-- Name: idx_user_answers_user_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_answers_user_topic ON public.user_answers USING btree (user_id, topic_id);


--
-- Name: idx_user_sessions_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_last_seen ON public.user_sessions USING btree (last_seen);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: free_daily_usage free_daily_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_daily_usage
    ADD CONSTRAINT free_daily_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reminder_log reminder_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reminder_settings reminder_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings
    ADD CONSTRAINT reminder_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_questions saved_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_questions
    ADD CONSTRAINT saved_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: telegram_link_tokens telegram_link_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_link_tokens
    ADD CONSTRAINT telegram_link_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: telegram_links telegram_links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_links
    ADD CONSTRAINT telegram_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_answers user_answers_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.test_results(id) ON DELETE CASCADE;


--
-- Name: user_answers user_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin Admin login check; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin login check" ON public.admin FOR SELECT TO authenticated, anon USING (true);


--
-- Name: contact_messages Anyone can insert message; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert message" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: profiles Anyone can read profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: profiles Service role all access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role all access" ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_sessions Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.user_sessions USING (true) WITH CHECK (true);


--
-- Name: test_results Users can insert own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own results" ON public.test_results FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: test_results Users can view own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own results" ON public.test_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: admin; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages admin_can_read_contact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_can_read_contact ON public.contact_messages FOR SELECT TO authenticated USING (true);


--
-- Name: profiles admins_select_all_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_select_all_profiles ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::text));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages anyone_can_insert_contact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_can_insert_contact ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_no_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_no_public ON public.audit_log USING (false);


--
-- Name: chek; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chek ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: free_daily_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.free_daily_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods payment_methods_no_public_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_methods_no_public_access ON public.payment_methods USING (false);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_questions saved_questions_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY saved_questions_select_own ON public.saved_questions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: telegram_bot_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: telegram_bot_sessions telegram_bot_sessions_no_public_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY telegram_bot_sessions_no_public_access ON public.telegram_bot_sessions USING (false);


--
-- Name: telegram_link_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: telegram_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

--
-- Name: test_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

--
-- Name: test_results test_results_admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY test_results_admin_read ON public.test_results FOR SELECT USING (public.has_role(auth.uid(), 'admin'::text));


--
-- Name: user_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_answers user_answers_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_answers_select_own ON public.user_answers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION admin_create_user(p_email text, p_password text, p_name text, p_username text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.admin_create_user(p_email text, p_password text, p_name text, p_username text) TO anon;
GRANT ALL ON FUNCTION public.admin_create_user(p_email text, p_password text, p_name text, p_username text) TO authenticated;
GRANT ALL ON FUNCTION public.admin_create_user(p_email text, p_password text, p_name text, p_username text) TO service_role;


--
-- Name: FUNCTION admin_delete_user(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.admin_delete_user(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_delete_user(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_delete_user(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION claim_free_session(p_kind text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.claim_free_session(p_kind text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_free_session(p_kind text) TO authenticated;
GRANT ALL ON FUNCTION public.claim_free_session(p_kind text) TO service_role;


--
-- Name: FUNCTION consume_free_sample(p_uid uuid, p_kind text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.consume_free_sample(p_uid uuid, p_kind text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.consume_free_sample(p_uid uuid, p_kind text) TO service_role;


--
-- Name: FUNCTION create_telegram_link_token(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_telegram_link_token() FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_telegram_link_token() TO authenticated;
GRANT ALL ON FUNCTION public.create_telegram_link_token() TO service_role;


--
-- Name: FUNCTION delete_push_endpoint(p_endpoint text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_push_endpoint(p_endpoint text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_push_endpoint(p_endpoint text) TO service_role;


--
-- Name: FUNCTION delete_push_subscription(p_endpoint text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_push_subscription(p_endpoint text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_push_subscription(p_endpoint text) TO authenticated;
GRANT ALL ON FUNCTION public.delete_push_subscription(p_endpoint text) TO service_role;


--
-- Name: FUNCTION due_reminders(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.due_reminders() FROM PUBLIC;
GRANT ALL ON FUNCTION public.due_reminders() TO service_role;


--
-- Name: FUNCTION get_admin_analytics(p_days integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_admin_analytics(p_days integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_admin_analytics(p_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_admin_analytics(p_days integer) TO service_role;


--
-- Name: FUNCTION get_daily_plan(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_daily_plan() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_daily_plan() TO authenticated;
GRANT ALL ON FUNCTION public.get_daily_plan() TO service_role;


--
-- Name: FUNCTION get_dashboard_stats(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT ALL ON FUNCTION public.get_dashboard_stats() TO service_role;


--
-- Name: FUNCTION get_my_mistakes(p_limit integer, p_offset integer, p_only_unresolved boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_my_mistakes(p_limit integer, p_offset integer, p_only_unresolved boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_mistakes(p_limit integer, p_offset integer, p_only_unresolved boolean) TO authenticated;
GRANT ALL ON FUNCTION public.get_my_mistakes(p_limit integer, p_offset integer, p_only_unresolved boolean) TO service_role;


--
-- Name: FUNCTION get_recent_activity(p_days integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_recent_activity(p_days integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_recent_activity(p_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_recent_activity(p_days integer) TO service_role;


--
-- Name: FUNCTION get_weak_topics(p_days integer, p_min_answers integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_weak_topics(p_days integer, p_min_answers integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_weak_topics(p_days integer, p_min_answers integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_weak_topics(p_days integer, p_min_answers integer) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_role(_user_id uuid, _role text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role text) TO anon;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role text) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role text) TO service_role;


--
-- Name: FUNCTION is_premium_now(p_uid uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_premium_now(p_uid uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_premium_now(p_uid uuid) TO service_role;


--
-- Name: FUNCTION link_telegram(p_token text, p_chat_id bigint); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.link_telegram(p_token text, p_chat_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.link_telegram(p_token text, p_chat_id bigint) TO service_role;


--
-- Name: FUNCTION mark_reminder_sent(p_uid uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mark_reminder_sent(p_uid uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.mark_reminder_sent(p_uid uuid) TO service_role;


--
-- Name: FUNCTION owned_question_keys(p_uid uuid, p_keys text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.owned_question_keys(p_uid uuid, p_keys text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owned_question_keys(p_uid uuid, p_keys text[]) TO service_role;


--
-- Name: FUNCTION plan_done_count(p_uid uuid, p_premium boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.plan_done_count(p_uid uuid, p_premium boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.plan_done_count(p_uid uuid, p_premium boolean) TO service_role;


--
-- Name: FUNCTION plan_window_start(p_uid uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.plan_window_start(p_uid uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.plan_window_start(p_uid uuid) TO service_role;


--
-- Name: FUNCTION save_push_subscription(p_endpoint text, p_p256dh text, p_auth text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) TO authenticated;
GRANT ALL ON FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) TO service_role;


--
-- Name: FUNCTION set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean) TO authenticated;
GRANT ALL ON FUNCTION public.set_reminder(p_enabled boolean, p_time text, p_telegram boolean, p_push boolean) TO service_role;


--
-- Name: FUNCTION stop_telegram_reminders(p_chat_id bigint); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.stop_telegram_reminders(p_chat_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.stop_telegram_reminders(p_chat_id bigint) TO service_role;


--
-- Name: FUNCTION submit_test(p_session_id uuid, p_variant integer, p_correct integer, p_total integer, p_time_seconds integer, p_answers jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.submit_test(p_session_id uuid, p_variant integer, p_correct integer, p_total integer, p_time_seconds integer, p_answers jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.submit_test(p_session_id uuid, p_variant integer, p_correct integer, p_total integer, p_time_seconds integer, p_answers jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.submit_test(p_session_id uuid, p_variant integer, p_correct integer, p_total integer, p_time_seconds integer, p_answers jsonb) TO service_role;


--
-- Name: FUNCTION toggle_saved_question(p_key text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.toggle_saved_question(p_key text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.toggle_saved_question(p_key text) TO authenticated;
GRANT ALL ON FUNCTION public.toggle_saved_question(p_key text) TO service_role;


--
-- Name: FUNCTION track_event(p_name text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.track_event(p_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.track_event(p_name text) TO authenticated;
GRANT ALL ON FUNCTION public.track_event(p_name text) TO service_role;


--
-- Name: FUNCTION unlink_telegram(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.unlink_telegram() FROM PUBLIC;
GRANT ALL ON FUNCTION public.unlink_telegram() TO authenticated;
GRANT ALL ON FUNCTION public.unlink_telegram() TO service_role;


--
-- Name: TABLE admin; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin TO anon;
GRANT ALL ON TABLE public.admin TO authenticated;
GRANT ALL ON TABLE public.admin TO service_role;


--
-- Name: TABLE analytics_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.analytics_events TO service_role;


--
-- Name: SEQUENCE analytics_events_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.analytics_events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.analytics_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.analytics_events_id_seq TO service_role;


--
-- Name: TABLE audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log TO anon;
GRANT ALL ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;


--
-- Name: TABLE chek; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.chek TO anon;
GRANT ALL ON TABLE public.chek TO authenticated;
GRANT ALL ON TABLE public.chek TO service_role;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;


--
-- Name: TABLE free_daily_usage; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.free_daily_usage TO service_role;


--
-- Name: TABLE payment_methods; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_methods TO anon;
GRANT ALL ON TABLE public.payment_methods TO authenticated;
GRANT ALL ON TABLE public.payment_methods TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.push_subscriptions TO service_role;


--
-- Name: TABLE reminder_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.reminder_log TO service_role;


--
-- Name: TABLE reminder_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.reminder_settings TO service_role;


--
-- Name: TABLE saved_questions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE public.saved_questions TO authenticated;
GRANT ALL ON TABLE public.saved_questions TO service_role;


--
-- Name: TABLE telegram_bot_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.telegram_bot_sessions TO anon;
GRANT ALL ON TABLE public.telegram_bot_sessions TO authenticated;
GRANT ALL ON TABLE public.telegram_bot_sessions TO service_role;


--
-- Name: TABLE telegram_link_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.telegram_link_tokens TO service_role;


--
-- Name: TABLE telegram_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.telegram_links TO service_role;


--
-- Name: TABLE test_results; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.test_results TO anon;
GRANT ALL ON TABLE public.test_results TO authenticated;
GRANT ALL ON TABLE public.test_results TO service_role;


--
-- Name: TABLE user_answers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE public.user_answers TO authenticated;
GRANT ALL ON TABLE public.user_answers TO service_role;


--
-- Name: SEQUENCE user_answers_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.user_answers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_answers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_answers_id_seq TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_sessions TO anon;
GRANT ALL ON TABLE public.user_sessions TO authenticated;
GRANT ALL ON TABLE public.user_sessions TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--


