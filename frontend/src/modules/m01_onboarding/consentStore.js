import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Per-child consent (Table 4.2 ConsentPreference), saved on the phone and versioned,
 * so every change can be traced. Camera monitoring is off unless the parent turns it on (BR-24).
 * Sync to the backend comes with M-08.
 */
const key = (childId) => `@silent_screen/consent/${childId}`;

export const DEFAULT_CONSENT = { audioLocalAllowed: true, cameraAllowed: false, derivedSyncAllowed: false };

export async function loadConsent(childId) {
  const raw = await AsyncStorage.getItem(key(childId));
  return raw ? JSON.parse(raw) : null;
}

export async function saveConsent(childId, choices, now = Date.now) {
  const previous = await loadConsent(childId);
  const record = {
    childId,
    ...DEFAULT_CONSENT,
    ...choices,
    version: (previous?.version || 0) + 1,
    updatedAt: new Date(now()).toISOString(),
  };
  await AsyncStorage.setItem(key(childId), JSON.stringify(record));
  return record;
}
