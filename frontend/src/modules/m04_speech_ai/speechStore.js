/**
 * M04 — Speech AI: Session store
 *
 * NOTE (Fasih's review): Speech module sirf result return karta hai — kuch save nahi karta.
 * Game session save karna M09 dashboard / M08 sync ka kaam hai (Task 5, Awais).
 * Agar M04 bhi save kare to ek hi data do jagah save hoga.
 *
 * Yeh file ab sirf ek thin helper export karti hai jo M09/M10 chahein to use kar sakti hain,
 * lekin `mockRecognizer` ya `index.js` isko call nahi karte.
 *
 * Data shape (for M09/M10 reference):
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

/**
 * Save a new session result.
 * Called by M09 dashboard / M08 sync — NOT by M04 speech module itself.
 */
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
