import { createClientId } from '../../utils/helpers';

/**
 * Baseline screening rules (FR-2, BR-4 to BR-6) as pure functions over a
 * BaselineAssessment record (Table 4.2), so the screen stays simple and testable.
 */
export const MAX_ATTEMPTS = 3; // BR-5: then the task is marked inconclusive
export const REASSESS_DAYS = 30; // BR-6
const DAY_MS = 24 * 60 * 60 * 1000;

export function createBaseline(childId, checklist, now = Date.now()) {
  return {
    baselineId: createClientId(),
    childId,
    checklistVersion: checklist.version,
    taskIds: checklist.tasks.map((t) => t.id),
    responses: [], // { taskId, result: 'said' | 'inconclusive' | 'skipped', attempts }
    attempts: 1, // attempt number on the current task
    baselineScore: null,
    status: 'incomplete',
    startedAt: new Date(now).toISOString(),
    completedAt: null,
  };
}

export const currentTaskId = (b) => (b.status === 'complete' ? null : b.taskIds[b.responses.length]);
export const progressPercent = (b) => Math.round((100 * b.responses.length) / b.taskIds.length);

/**
 * Score = share of attempted tasks the child said (0–100). Skipped tasks are left out
 * (the parent chose not to ask); inconclusive tasks count as not yet said.
 */
export function scoreOf(responses) {
  const attempted = responses.filter((r) => r.result !== 'skipped');
  if (attempted.length === 0) return null;
  return Math.round((100 * attempted.filter((r) => r.result === 'said').length) / attempted.length);
}

function answer(b, result, now) {
  const taskId = currentTaskId(b);
  if (taskId === undefined || taskId === null) return b;
  const responses = [...b.responses, { taskId, result, attempts: b.attempts }];
  const done = responses.length === b.taskIds.length;
  return {
    ...b,
    responses,
    attempts: 1,
    status: done ? 'complete' : 'incomplete',
    baselineScore: done ? scoreOf(responses) : null,
    completedAt: done ? new Date(now).toISOString() : null,
  };
}

/** The parent heard the child say the word. */
export const recordSaid = (b, now = Date.now()) => answer(b, 'said', now);

/** Ask again; after the 3rd unsuccessful attempt the task is inconclusive (BR-5). */
export const recordTryAgain = (b, now = Date.now()) =>
  b.attempts >= MAX_ATTEMPTS ? answer(b, 'inconclusive', now) : { ...b, attempts: b.attempts + 1 };

export const recordSkip = (b, now = Date.now()) => answer(b, 'skipped', now);

/** BR-6: a full re-assessment only once every 30 days after the last completed one. */
export function canStartNewBaseline(lastCompleted, now = Date.now()) {
  if (!lastCompleted?.completedAt) return true;
  return now - Date.parse(lastCompleted.completedAt) >= REASSESS_DAYS * DAY_MS;
}
