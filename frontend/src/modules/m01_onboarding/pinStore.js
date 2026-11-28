import AsyncStorage from '@react-native-async-storage/async-storage';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { saveAccountPin, verifyAccountPin } from '../../api/auth';
import { initialLockState, registerSuccess } from './pinLock';

/**
 * Parent PIN storage for PinScreen (BR-34: the PIN is stored only in hashed form).
 * The PIN is hashed with PBKDF2-SHA256 and a per-PIN salt, so the plain PIN is never saved.
 * Account-synced wrapper (`createAccountPinStore`) keeps the phone cache and backend account PIN in sync.
 */
const PIN_KEY = '@silent_screen/parent_pin';
const LOCK_KEY = '@silent_screen/pin_lock';
export const ITERATIONS = 10000; // slows down guessing all 10,000 four-digit PINs

// The salt only has to be unique, not secret, so a time + random value is enough.
const makeSalt = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const hashPin = (pin, salt) => bytesToHex(pbkdf2(sha256, pin, salt, { c: ITERATIONS, dkLen: 32 }));

async function readJson(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export async function hasPin() {
  return (await readJson(PIN_KEY)) !== null;
}

export async function savePin(pin) {
  const salt = makeSalt();
  await AsyncStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: hashPin(pin, salt) }));
}

export async function checkPin(pin) {
  const stored = await readJson(PIN_KEY);
  return stored !== null && hashPin(pin, stored.salt) === stored.hash;
}

export async function loadLockState() {
  return (await readJson(LOCK_KEY)) || { ...initialLockState };
}

export async function saveLockState(state) {
  await AsyncStorage.setItem(LOCK_KEY, JSON.stringify(state));
}

export async function clearLocalPin() {
  await Promise.all([
    AsyncStorage.removeItem(PIN_KEY),
    AsyncStorage.removeItem(LOCK_KEY),
  ]);
}

/**
 * PinScreen store backed by both local offline PBKDF2 hash and guardian account PIN endpoints.
 */
export function createAccountPinStore({
  hasAccountPin = false,
  onPinSynced,
  saveRemotePin = saveAccountPin,
  verifyRemotePin = verifyAccountPin,
} = {}) {
  return {
    async hasPin() {
      if (await hasPin()) return true;
      return Boolean(hasAccountPin);
    },

    async savePin(pin) {
      await savePin(pin);
      try {
        await saveRemotePin({ pin });
        onPinSynced?.();
      } catch {
        // Offline-first: local salted PIN still protects Parent Portal immediately.
      }
    },

    async checkPin(pin) {
      if (await hasPin()) {
        return checkPin(pin);
      }
      if (!hasAccountPin) return false;
      try {
        const res = await verifyRemotePin(pin);
        if (res?.data?.valid) {
          await savePin(pin);
          return true;
        }
        return false;
      } catch (error) {
        if (error?.response?.status === 401) return false;
        throw error;
      }
    },

    loadLockState,
    saveLockState,

    async resetWithPassword({ password, newPin }) {
      await saveRemotePin({ pin: newPin, password });
      await savePin(newPin);
      await saveLockState(registerSuccess());
      onPinSynced?.();
    },
  };
}
