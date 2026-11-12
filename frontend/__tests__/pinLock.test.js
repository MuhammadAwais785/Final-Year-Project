import {
  initialLockState, isLocked, isPinComplete, lockRemainingMs, registerFailure, registerSuccess, remainingAttempts,
} from '../src/modules/m01_onboarding/pinLock';
import { PIN } from '../src/utils/constants';

const NOW = 1_000_000;
const failTimes = (n, now = NOW) => Array.from({ length: n }).reduce((s) => registerFailure(s, now), initialLockState);

describe('PIN format', () => {
  test('accepts exactly 4 digits only', () => {
    expect(isPinComplete('1234')).toBe(true);
    ['123', '12345', '12a4', ''].forEach((pin) => expect(isPinComplete(pin)).toBe(false));
  });
});

describe('PIN lockout (BR-34)', () => {
  test('counts down the attempts left without locking before the 5th wrong PIN', () => {
    const state = failTimes(PIN.MAX_ATTEMPTS - 1);
    expect(isLocked(state, NOW)).toBe(false);
    expect(remainingAttempts(state)).toBe(1);
  });

  test('locks on the 5th wrong PIN in a row for the lock period', () => {
    const state = failTimes(PIN.MAX_ATTEMPTS);
    expect(isLocked(state, NOW)).toBe(true);
    expect(lockRemainingMs(state, NOW)).toBe(PIN.LOCK_MS);
    expect(isLocked(state, NOW + PIN.LOCK_MS - 1)).toBe(true);
    expect(isLocked(state, NOW + PIN.LOCK_MS)).toBe(false);
    expect(lockRemainingMs(state, NOW + PIN.LOCK_MS)).toBe(0);
  });

  test('ignores attempts while locked', () => {
    const locked = failTimes(PIN.MAX_ATTEMPTS);
    expect(registerFailure(locked, NOW + 1000)).toBe(locked);
  });

  test('gives a fresh set of attempts after the lock ends', () => {
    const after = registerFailure(failTimes(PIN.MAX_ATTEMPTS), NOW + PIN.LOCK_MS);
    expect(isLocked(after, NOW + PIN.LOCK_MS)).toBe(false);
    expect(remainingAttempts(after)).toBe(PIN.MAX_ATTEMPTS - 1);
  });

  test('a correct PIN resets the count', () => {
    expect(failTimes(3).failedAttempts).toBe(3);
    expect(registerSuccess()).toEqual(initialLockState);
  });
});
