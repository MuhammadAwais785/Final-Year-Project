import { PIN } from '../../utils/constants';

/**
 * Wrong-PIN lockout rules (BR-34): pure functions over a small state object,
 * so the screen and the stored state stay simple and testable.
 * state: { failedAttempts: number, lockedUntil: number | null } (epoch ms)
 */
export const initialLockState = { failedAttempts: 0, lockedUntil: null };

export const isPinComplete = (pin) => pin.length === PIN.LENGTH && /^\d+$/.test(pin);

export const isLocked = (state, now) => state.lockedUntil !== null && now < state.lockedUntil;

export const lockRemainingMs = (state, now) => (isLocked(state, now) ? state.lockedUntil - now : 0);

export const remainingAttempts = (state) => PIN.MAX_ATTEMPTS - state.failedAttempts;

/** A wrong PIN. The 5th wrong PIN in a row locks entry and starts a fresh count. */
export function registerFailure(state, now) {
  if (isLocked(state, now)) return state;
  const failedAttempts = state.failedAttempts + 1;
  return failedAttempts >= PIN.MAX_ATTEMPTS
    ? { failedAttempts: 0, lockedUntil: now + PIN.LOCK_MS }
    : { failedAttempts, lockedUntil: null };
}

/** A correct PIN clears the count. */
export const registerSuccess = () => ({ ...initialLockState });
