/**
 * M04 — Speech AI: Session store
 *
 * Saves and loads speech session results to AsyncStorage so the parent
 * dashboard (M09) and reports (M10) can read them later.
 *
 * Data shape per session:
 * {
 *   id:          string    - unique key
 *   childId:     string    - child profile id
 *   word:        string    - the target word
 *   language:    'en'|'ur'
 *   transcript:  string    - what was heard
 *   score:       number    - 0–100
 *   label:       string    - 'perfect'|'good'|'try_again'|'no_match'
 *   timestamp:   number    - Date.now()
 *   gameId:      string    - e.g. 'objectNaming'
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'speech_sessions_v1';

/** Load all saved sessions (returns [] if none). */
export async function loadSessions() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** Save a new session result. */
export async function saveSession(session) {
  try {
    const all = await loadSessions();
    const record = {
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...session,
    };
    all.push(record);
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    return record;
  } catch (err) {
    console.warn('[speechStore] saveSession failed:', err);
    return null;
  }
}

/** Load sessions for one child (most recent first). */
export async function loadSessionsForChild(childId) {
  const all = await loadSessions();
  return all
    .filter((s) => s.childId === childId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Clear all stored sessions (for testing / data wipe). */
export async function clearSessions() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (_) {
    // ignore
  }
}
