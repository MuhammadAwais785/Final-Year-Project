import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Baselines on the phone, per child: the one in progress (so "Save and continue later"
 * can resume it) and the last completed one (for the 30-day rule and goals). Sync comes with M-08.
 */
const inProgressKey = (childId) => `@silent_screen/baseline/${childId}/in_progress`;
const completedKey = (childId) => `@silent_screen/baseline/${childId}/completed`;

async function read(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export const loadInProgress = (childId) => read(inProgressKey(childId));
export const loadLastCompleted = (childId) => read(completedKey(childId));

/** Saves a baseline; a completed one replaces the last completed and clears the in-progress one. */
export async function saveBaseline(baseline) {
  if (baseline.status === 'complete') {
    await AsyncStorage.setItem(completedKey(baseline.childId), JSON.stringify(baseline));
    await AsyncStorage.removeItem(inProgressKey(baseline.childId));
  } else {
    await AsyncStorage.setItem(inProgressKey(baseline.childId), JSON.stringify(baseline));
  }
}
