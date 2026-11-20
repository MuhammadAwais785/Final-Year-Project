import AsyncStorage from '@react-native-async-storage/async-storage';
import * as pinStore from '../src/modules/m01_onboarding/pinStore';

jest.mock('@react-native-async-storage/async-storage', () => {
  let data = {};
  return {
    getItem: jest.fn(async (k) => (k in data ? data[k] : null)),
    setItem: jest.fn(async (k, v) => { data[k] = v; }),
    clear: async () => { data = {}; },
  };
});

beforeEach(() => AsyncStorage.clear());

const savedValues = () => AsyncStorage.setItem.mock.calls.map(([, value]) => value).join(' ');

describe('pinStore (BR-34)', () => {
  test('there is no PIN until one is saved', async () => {
    expect(await pinStore.hasPin()).toBe(false);
    expect(await pinStore.checkPin('1234')).toBe(false);
    await pinStore.savePin('1234');
    expect(await pinStore.hasPin()).toBe(true);
  });

  test('accepts the saved PIN and rejects any other', async () => {
    await pinStore.savePin('2468');
    expect(await pinStore.checkPin('2468')).toBe(true);
    expect(await pinStore.checkPin('2469')).toBe(false);
    expect(await pinStore.checkPin('')).toBe(false);
  });

  test('never stores the PIN itself, only a salted hash', async () => {
    AsyncStorage.setItem.mockClear();
    await pinStore.savePin('2468');
    expect(savedValues()).not.toContain('2468');
    const { salt, hash } = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(hash).toBe(pinStore.hashPin('2468', salt));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('the same PIN saved twice gets a different salt and hash', async () => {
    await pinStore.savePin('1111');
    const first = JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1]);
    await pinStore.savePin('1111');
    const second = JSON.parse(AsyncStorage.setItem.mock.calls.at(-1)[1]);
    expect(second.salt).not.toBe(first.salt);
    expect(second.hash).not.toBe(first.hash);
    expect(await pinStore.checkPin('1111')).toBe(true);
  });

  test('hashPin matches the published PBKDF2-HMAC-SHA256 algorithm', () => {
    // RFC 7914 test vector uses c=1; our iteration count is checked separately.
    const { pbkdf2 } = require('@noble/hashes/pbkdf2');
    const { sha256 } = require('@noble/hashes/sha256');
    const { bytesToHex } = require('@noble/hashes/utils');
    expect(bytesToHex(pbkdf2(sha256, 'password', 'salt', { c: 1, dkLen: 32 })))
      .toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
    expect(pinStore.ITERATIONS).toBeGreaterThanOrEqual(10000);
  });

  test('the lock state starts empty and survives a reload', async () => {
    expect(await pinStore.loadLockState()).toEqual({ failedAttempts: 0, lockedUntil: null });
    await pinStore.saveLockState({ failedAttempts: 0, lockedUntil: 123456 });
    expect(await pinStore.loadLockState()).toEqual({ failedAttempts: 0, lockedUntil: 123456 });
  });
});
