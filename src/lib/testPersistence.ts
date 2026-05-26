/**
 * Shared test persistence utilities.
 * All test interfaces use these helpers to ensure consistent
 * save/restore/cleanup behaviour across refresh, tab-close, and browser restart.
 */

export interface PersistedTestState {
  questions?: unknown[];
  currentQuestion?: number;
  selectedAnswers?: Record<number, number>;
  correctAnswers?: Record<number, boolean>;
  revealedQuestions?: Record<number, boolean>;
  /** Absolute timestamp (ms) when the test timer expires */
  endsAt?: number;
  /** Absolute timestamp (ms) when the test was first started */
  startedAt?: number;
  /** Kept for backward-compat with old saves that stored raw seconds */
  timeRemaining?: number;
}

/** Read raw saved state without throwing */
export function getSavedTestState(storageKey: string): PersistedTestState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as PersistedTestState;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Lazy useState initializer: returns remaining seconds from the saved endsAt
 * timestamp, or falls back to the component's defaultTime.
 * Call this inside `useState(() => getInitialTimeRemaining(...))`.
 */
export function getInitialTimeRemaining(storageKey: string, defaultTime: number): number {
  const saved = getSavedTestState(storageKey);
  if (saved?.endsAt) {
    return Math.max(0, Math.floor((saved.endsAt - Date.now()) / 1000));
  }
  // Legacy saves stored raw seconds
  if (saved?.timeRemaining != null) return saved.timeRemaining;
  return defaultTime;
}

/**
 * Lazy useState initializer: returns the original startedAt timestamp so that
 * timeTaken is computed correctly even after a page refresh.
 */
export function getInitialStartedAt(storageKey: string): number {
  const saved = getSavedTestState(storageKey);
  return saved?.startedAt ?? Date.now();
}

/** Remove test state from localStorage. Silent – never throws. */
export function clearTestState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore quota / security errors
  }
}
