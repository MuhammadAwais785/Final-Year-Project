import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME } from '../../utils/constants';

/**
 * Star totals on the phone, per child (FR-6, FR-8). Every key holds the child id, and nothing
 * here reads another child's data (BR-19). Stars are only ever added, never taken away (BR-28),
 * so there is deliberately no subtract function.
 */
const rewardsKey = (childId) => `@silent_screen/rewards/${childId}`;

// Local calendar day, so the daily count resets at the child's midnight.
const dayOf = (now) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const EMPTY = { totalStars: 0, todayStars: 0, day: null };
const count = (n) => (Number.isInteger(n) && n > 0 ? n : 0);

// A damaged record reads as empty, so it can never block saving stars.
async function read(childId) {
  const raw = await AsyncStorage.getItem(rewardsKey(childId));
  if (!raw) return EMPTY;
  try {
    const s = JSON.parse(raw);
    return { totalStars: count(s?.totalStars), todayStars: count(s?.todayStars), day: typeof s?.day === 'string' ? s.day : null };
  } catch {
    return EMPTY;
  }
}

const view = (stored, now) => {
  const todayStars = stored.day === dayOf(now) ? stored.todayStars : 0;
  return { totalStars: stored.totalStars, todayStars, milestoneReachedToday: todayStars >= GAME.DAILY_MILESTONE_STARS };
};

export async function getRewards(childId, now = Date.now()) {
  return view(await read(childId), now);
}

// Writes for one child run one after another, so two quick calls cannot overwrite each other.
const queues = new Map();
function enqueue(childId, task) {
  const run = (queues.get(childId) ?? Promise.resolve()).then(task);
  queues.set(childId, run.catch(() => {}));
  return run;
}

/** Adds stars to the total and today's count. milestoneJustReached is true only on the call that crosses the daily goal. */
export function addStars(childId, stars, now = Date.now()) {
  if (!childId) return Promise.reject(new Error('childId required'));
  return enqueue(childId, async () => {
    const stored = await read(childId);
    const before = view(stored, now);
    if (!Number.isInteger(stars) || stars <= 0) return { ...before, milestoneJustReached: false };
    const next = { totalStars: stored.totalStars + stars, todayStars: before.todayStars + stars, day: dayOf(now) };
    await AsyncStorage.setItem(rewardsKey(childId), JSON.stringify(next));
    const after = view(next, now);
    return { ...after, milestoneJustReached: !before.milestoneReachedToday && after.milestoneReachedToday };
  });
}
