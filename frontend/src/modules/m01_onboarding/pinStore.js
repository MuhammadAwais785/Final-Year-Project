import AsyncStorage from '@react-native-async-storage/async-storage';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { initialLockState } from './pinLock';

/**
 * Parent PIN storage for PinScreen (BR-34: the PIN is stored only in hashed form).
 * The PIN is hashed with PBKDF2-SHA256 and a per-PIN salt, so the plain PIN is never saved.
 * Note: the PIN is kept on this phone for now; the SRS ties it to the account,
 * so it moves to the backend with the sync work (M-08).
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
