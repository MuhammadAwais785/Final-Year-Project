import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACTIVITIES, SESSIONS } from '../../utils/constants';
import { createClientId } from '../../utils/helpers';
import { summarize } from './round';

/**
 * Finished and part-finished game rounds on the phone, per child (UC-5 POST-1, Table 4.2).
 * Kept for the later sync; only the oldest synced sessions past the cap are ever deleted, never an unsynced one.
 * Only the fields below are stored: never audio and never what was heard (BR-20).
 */
const sessionsKey = (childId) => `@silent_screen/sessions/${childId}`;

// The record shape lives here only, so a change agreed for the sync is a one-place edit.
// stars = earned in the round; only finished rounds are credited to the child's total (rewardStore).
const toSession = (childId, { activity, startedAt, endedAt, partial, round }) => {
  const { stars, practiced, correct } = summarize(round);
  return { clientId: createClientId(), childId, activity, startedAt, endedAt, stars, practiced, correct, partial: !!partial, synced: false };
};
const toAttempt = (sessionClientId, a) => ({
  sessionClientId, promptId: a.promptId, status: a.status, score: a.score, hintLevel: a.hintLevel, at: a.at,
});

const EMPTY = { sessions: [], attempts: [] };

// A damaged record reads as empty, so it can never block saving.
async function read(childId) {
  const raw = await AsyncStorage.getItem(sessionsKey(childId));
  if (!raw) return EMPTY;
  try {
    const s = JSON.parse(raw);
    const ok = (x) => x && typeof x === 'object';
    return { sessions: Array.isArray(s?.sessions) ? s.sessions.filter((x) => ok(x) && x.clientId) : [], attempts: Array.isArray(s?.attempts) ? s.attempts.filter(ok) : [] };
  } catch {
    return EMPTY;
  }
}

// Writes for one child run one after another, so two quick saves cannot overwrite each other.
const queues = new Map();
function enqueue(childId, task) {
  const run = (queues.get(childId) ?? Promise.resolve()).then(task);
  queues.set(childId, run.catch(() => {}));
  return run;
}

const write = (childId, data) => AsyncStorage.setItem(sessionsKey(childId), JSON.stringify(data));

// Past the cap, drop the oldest synced sessions only; an unsynced session is never lost.
function trim(sessions) {
  let extra = sessions.length - SESSIONS.MAX_PER_CHILD;
  if (extra <= 0) return sessions;
  return sessions.filter((s) => {
    if (extra > 0 && s.synced) { extra -= 1; return false; }
    return true;
  });
}

/** Saves one round as a session plus its attempts and returns the session. */
export function saveSession(childId, input) {
  if (!childId) return Promise.reject(new Error('childId required'));
  if (!Object.values(ACTIVITIES).includes(input?.activity)) return Promise.reject(new Error('known activity required'));
  return enqueue(childId, async () => {
    const stored = await read(childId);
    const session = toSession(childId, input);
    const attempts = (input.round.attemptLog ?? []).map((a) => toAttempt(session.clientId, a));
    const sessions = trim([...stored.sessions, session]);
    const kept = new Set(sessions.map((s) => s.clientId));
    await write(childId, { sessions, attempts: [...stored.attempts, ...attempts].filter((a) => kept.has(a.sessionClientId)) });
    return session;
  });
}

/** Sessions for one child, newest first. */
export async function getSessions(childId) {
  if (!childId) return [];
  return [...(await read(childId)).sessions].reverse();
}

/** Sessions not yet synced, oldest first, with their attempts, for the sync. */
export async function getUnsynced(childId) {
  if (!childId) return { sessions: [], attempts: [] };
  const { sessions, attempts } = await read(childId);
  const pending = sessions.filter((s) => !s.synced);
  const ids = new Set(pending.map((s) => s.clientId));
  return { sessions: pending, attempts: attempts.filter((a) => ids.has(a.sessionClientId)) };
}

/** Flags sessions as synced. Keeps them: nothing is deleted. */
export function markSynced(childId, clientIds) {
  if (!childId) return Promise.reject(new Error('childId required'));
  const ids = new Set(clientIds ?? []);
  return enqueue(childId, async () => {
    const stored = await read(childId);
    await write(childId, { ...stored, sessions: stored.sessions.map((s) => (ids.has(s.clientId) ? { ...s, synced: true } : s)) });
  });
}
