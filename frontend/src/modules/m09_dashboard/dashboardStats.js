import { GOAL_TYPES } from '../m01_onboarding/goals';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function sessionDurationMs(session) {
  const start = Number(session?.startedAt);
  const end = Number(session?.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return end - start;
}

function startOfLocalDay(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Computes progress toward each parent goal using recent sessions.
 */
export function evaluateGoalsProgress({ goals = [], weeklySessions = [], todayMinutes = 0 }) {
  const weeklyWords = weeklySessions.reduce((sum, s) => sum + (s.correct || 0), 0);

  return goals.map((goal) => {
    if (goal.type === GOAL_TYPES.WEEKLY_WORDS) {
      const target = goal.target || 1;
      return {
        goal,
        current: weeklyWords,
        target,
        percent: Math.min(100, Math.round((weeklyWords / target) * 100)),
      };
    }
    if (goal.type === GOAL_TYPES.DAILY_MINUTES) {
      const target = goal.target || 1;
      return {
        goal,
        current: todayMinutes,
        target,
        percent: Math.min(100, Math.round((todayMinutes / target) * 100)),
      };
    }
    return {
      goal,
      current: weeklySessions.length,
      target: null,
      percent: weeklySessions.length > 0 ? 100 : 0,
    };
  });
}

/**
 * Counts prompts where hints were triggered most often (BR-20: promptId and hintLevel only).
 */
export function summarizeHintHotspots(attempts = [], limit = 4) {
  const counts = new Map();
  for (const a of attempts) {
    if (!a?.promptId) continue;
    const prev = counts.get(a.promptId) || { promptId: a.promptId, hints: 0, attempts: 0 };
    prev.attempts += 1;
    if ((a.hintLevel || 0) > 0) prev.hints += 1;
    counts.set(a.promptId, prev);
  }

  return Array.from(counts.values())
    .filter((item) => item.hints > 0)
    .sort((a, b) => b.hints - a.hints || b.attempts - a.attempts)
    .slice(0, limit);
}

/**
 * Computes single-child dashboard analytics (BR-19: never compares two children).
 */
export function computeDashboardStats({
  sessions = [],
  attempts = [],
  goals = [],
  rewards = { totalStars: 0, todayStars: 0 },
  now = Date.now(),
}) {
  const weekCutoff = now - WEEK_MS;
  const dayStart = startOfLocalDay(now);

  const sorted = [...sessions].sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
  const weekly = sorted.filter((s) => (s.endedAt || s.startedAt || 0) >= weekCutoff);
  const today = sorted.filter((s) => (s.endedAt || s.startedAt || 0) >= dayStart);

  const weeklyMinutes = Math.round(weekly.reduce((sum, s) => sum + sessionDurationMs(s), 0) / 60000);
  const todayMinutes = Math.round(today.reduce((sum, s) => sum + sessionDurationMs(s), 0) / 60000);

  const weeklyPracticed = weekly.reduce((sum, s) => sum + (s.practiced || 0), 0);
  const weeklyCorrect = weekly.reduce((sum, s) => sum + (s.correct || 0), 0);
  const weeklyStars = weekly.reduce((sum, s) => sum + (s.stars || 0), 0);

  return {
    totalStars: rewards?.totalStars ?? 0,
    todayStars: rewards?.todayStars ?? 0,
    weeklySessionsCount: weekly.length,
    weeklyMinutes,
    todayMinutes,
    weeklyPracticed,
    weeklyCorrect,
    weeklyStars,
    goalProgress: evaluateGoalsProgress({ goals, weeklySessions: weekly, todayMinutes }),
    recentSessions: sorted.slice(0, 5),
    topHintedPrompts: summarizeHintHotspots(attempts),
  };
}
