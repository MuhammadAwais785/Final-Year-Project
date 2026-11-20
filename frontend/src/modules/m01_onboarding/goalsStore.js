import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOAL_TYPES, validateGoals } from './goals';

/** Goals on the phone, per child (FR-3). Sync comes with M-08. */
const key = (childId) => `@silent_screen/goals/${childId}`;

/** Saved goals, or null when none are saved or the record is unreadable. */
export async function getGoals(childId) {
  if (!childId) return null;
  const raw = await AsyncStorage.getItem(key(childId));
  if (!raw) return null;
  try {
    const goals = JSON.parse(raw);
    return Array.isArray(goals) ? goals.filter((g) => g && typeof g === 'object' && g.id && Object.values(GOAL_TYPES).includes(g.type)) : null;
  } catch {
    return null;
  }
}

/** Validates, then saves. Throws (with .errors for invalid goals) so bad data never reaches storage (BR-7). */
export async function saveGoals(childId, goals) {
  if (!childId) throw new Error('A child is required to save goals.');
  const { valid, errors } = validateGoals(goals);
  if (!valid) throw Object.assign(new Error('Goals are not valid.'), { errors });
  await AsyncStorage.setItem(key(childId), JSON.stringify(goals));
  return goals;
}
