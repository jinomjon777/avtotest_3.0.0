-- ============================================================
-- MIGRATION: Access Control & Security Hardening
-- ============================================================

-- 1. Add missing subscription/trial columns to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tariff_days       INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tariff_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tariff_end_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial_used     BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_start_date  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date    TIMESTAMPTZ;

-- 2. Fix test_results variant constraint: allow 1..100 (covers 1-61 variants + 56 free sentinel)
-- ============================================================
ALTER TABLE public.test_results
  DROP CONSTRAINT IF EXISTS test_results_variant_check;

ALTER TABLE public.test_results
  ADD CONSTRAINT test_results_variant_check CHECK (variant >= 0 AND variant <= 100);

-- 3. Add access metadata columns to test_results
-- ============================================================
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS access_type  TEXT CHECK (access_type IN ('guest','free','trial','pro')) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_premium   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS question_source TEXT;

-- 4. Create test_sessions table for server-side session tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type   TEXT        NOT NULL CHECK (access_type IN ('guest','free','trial','pro')),
  is_premium    BOOLEAN     NOT NULL DEFAULT false,
  question_source TEXT      NOT NULL,
  variant       INTEGER     NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Core function: get_user_access_state
--    Returns current access state for the calling user.
--    This is the single source of truth.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_access_state()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     UUID;
  v_profile     RECORD;
  v_state       TEXT;
  v_trial_active BOOLEAN := false;
  v_pro_active   BOOLEAN := false;
  v_expires_at   TIMESTAMPTZ;
BEGIN
  -- Get caller identity from JWT — never trust client-passed user_id
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('state', 'guest', 'is_premium', false);
  END IF;

  SELECT
    tariff_days,
    tariff_start_date,
    tariff_end_date,
    is_trial_used,
    trial_start_date,
    trial_end_date,
    created_at
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'free_logged_in', 'is_premium', false);
  END IF;

  -- Check PRO: explicit tariff_end_date takes priority; fall back to tariff_start + tariff_days
  IF v_profile.tariff_end_date IS NOT NULL THEN
    v_pro_active := v_profile.tariff_end_date > now();
    v_expires_at := v_profile.tariff_end_date;
  ELSIF v_profile.tariff_days > 0 AND v_profile.tariff_start_date IS NOT NULL THEN
    v_expires_at := v_profile.tariff_start_date + (v_profile.tariff_days || ' days')::INTERVAL;
    v_pro_active := v_expires_at > now();
  END IF;

  IF v_pro_active THEN
    RETURN jsonb_build_object(
      'state',      'active_pro',
      'is_premium', true,
      'expires_at', v_expires_at
    );
  END IF;

  -- Check if PRO existed but expired
  IF (v_profile.tariff_end_date IS NOT NULL AND v_profile.tariff_end_date <= now())
     OR (v_profile.tariff_days > 0 AND v_expires_at IS NOT NULL AND v_expires_at <= now())
  THEN
    RETURN jsonb_build_object('state', 'expired_pro', 'is_premium', false);
  END IF;

  -- Check Trial: trial_end_date is authoritative if set
  IF v_profile.is_trial_used THEN
    IF v_profile.trial_end_date IS NOT NULL THEN
      v_trial_active := v_profile.trial_end_date > now();
      v_expires_at   := v_profile.trial_end_date;
    ELSE
      -- Fallback: 1 hour from profile created_at
      v_expires_at   := v_profile.created_at + INTERVAL '1 hour';
      v_trial_active := v_expires_at > now();
    END IF;

    IF v_trial_active THEN
      RETURN jsonb_build_object(
        'state',      'active_trial',
        'is_premium', true,
        'expires_at', v_expires_at
      );
    ELSE
      RETURN jsonb_build_object('state', 'expired_trial', 'is_premium', false);
    END IF;
  END IF;

  RETURN jsonb_build_object('state', 'free_logged_in', 'is_premium', false);
END;
$$;

-- 6. Function: start_test_session
--    Creates a server-side session record and returns session_id + approved params.
--    Frontend must call this before loading questions.
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_test_session(
  p_variant         INTEGER,
  p_question_source TEXT,
  p_is_premium      BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_access     JSONB;
  v_state      TEXT;
  v_session_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_session_expires TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  -- Get current access state
  v_access := public.get_user_access_state();
  v_state  := v_access->>'state';

  -- Premium request but no premium access → reject
  IF p_is_premium AND v_state NOT IN ('active_pro', 'active_trial') THEN
    RETURN jsonb_build_object(
      'ok',    false,
      'error', 'no_premium_access',
      'state', v_state
    );
  END IF;

  -- Determine session expiry
  -- For premium sessions, session cannot outlive the access window
  IF p_is_premium AND (v_access->>'expires_at') IS NOT NULL THEN
    v_expires_at      := (v_access->>'expires_at')::TIMESTAMPTZ;
    -- Session is shorter of (access expiry) and (now + 90 min)
    v_session_expires := LEAST(v_expires_at, now() + INTERVAL '90 minutes');
  ELSE
    -- Free session: 90 minutes max
    v_session_expires := now() + INTERVAL '90 minutes';
  END IF;

  -- For guest (no user_id), just return approval without DB record
  IF v_user_id IS NULL THEN
    IF p_is_premium THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;
    RETURN jsonb_build_object(
      'ok',             true,
      'session_id',     NULL,
      'access_type',    'guest',
      'is_premium',     false,
      'expires_at',     v_session_expires
    );
  END IF;

  -- Insert session record
  INSERT INTO public.test_sessions (
    user_id, access_type, is_premium, question_source, variant, expires_at
  )
  VALUES (
    v_user_id,
    v_state,
    p_is_premium,
    p_question_source,
    p_variant,
    v_session_expires
  )
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'session_id',  v_session_id,
    'access_type', v_state,
    'is_premium',  p_is_premium,
    'expires_at',  v_session_expires
  );
END;
$$;

-- 7. Function: verify_and_save_test_result
--    Validates session is still valid, then saves result.
--    This is the ONLY way to insert into test_results securely.
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_and_save_test_result(
  p_session_id       UUID,
  p_variant          INTEGER,
  p_correct_answers  INTEGER,
  p_total_questions  INTEGER,
  p_time_taken_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_session    RECORD;
  v_access     JSONB;
  v_state      TEXT;
  v_result_id  UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- If no session_id provided (free/guest anonymous), do simple free insert
  IF p_session_id IS NULL THEN
    INSERT INTO public.test_results (
      user_id, variant, correct_answers, total_questions,
      time_taken_seconds, access_type, is_premium, question_source
    )
    VALUES (
      v_user_id, p_variant, p_correct_answers, p_total_questions,
      p_time_taken_seconds, 'free', false, 'free'
    )
    RETURNING id INTO v_result_id;
    RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
  END IF;

  -- Load session and verify ownership
  SELECT * INTO v_session
  FROM public.test_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  IF v_session.completed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_already_completed');
  END IF;

  -- *** KEY SECURITY CHECK ***
  -- For premium sessions, verify access is still valid RIGHT NOW
  -- (access may have expired since session was started)
  IF v_session.is_premium THEN
    v_access := public.get_user_access_state();
    v_state  := v_access->>'state';

    IF v_state NOT IN ('active_pro', 'active_trial') THEN
      -- Mark session as completed (failed) to prevent replay
      UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;
      RETURN jsonb_build_object(
        'ok',    false,
        'error', 'premium_access_expired',
        'state', v_state
      );
    END IF;

    -- Also check session's own expiry (belt-and-suspenders)
    IF v_session.expires_at < now() THEN
      UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;
      RETURN jsonb_build_object('ok', false, 'error', 'session_expired');
    END IF;
  END IF;

  -- Save result
  INSERT INTO public.test_results (
    user_id, variant, correct_answers, total_questions,
    time_taken_seconds, access_type, is_premium, question_source
  )
  VALUES (
    v_user_id,
    p_variant,
    p_correct_answers,
    p_total_questions,
    p_time_taken_seconds,
    v_session.access_type,
    v_session.is_premium,
    v_session.question_source
  )
  RETURNING id INTO v_result_id;

  -- Mark session completed
  UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;

  RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
END;
$$;

-- 8. Remove the direct INSERT policy on test_results.
--    Results must go through verify_and_save_test_result RPC only.
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own test results" ON public.test_results;

-- Allow the security-definer functions to insert (they run as postgres/owner)
-- Direct client inserts are now blocked. SELECT stays.
-- No INSERT policy = no direct client inserts possible.

-- 9. Grant execute on new functions to authenticated users
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_user_access_state()         TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_test_session(INTEGER, TEXT, BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
