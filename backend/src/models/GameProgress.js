const Session = require('./Session');

const DAILY_MILESTONE_STARS = 10; // Matches frontend GAME.DAILY_MILESTONE_STARS
const ACTIVITY_IDS = ['object_naming', 'colour_matching', 'sound_imitation'];

function startOfUtcDay(now) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Computes single-child rewards and per-activity game progress (FR-6, FR-8, BR-19, BR-28).
 * Only finished rounds (`partial === false`) credit stars to totals, matching phone rewardStore.
 */
function computeChildProgress(sessions = [], now = Date.now()) {
  const dayStart = startOfUtcDay(now);
  let totalStars = 0;
  let todayStars = 0;

  const byActivity = {};
  for (const id of ACTIVITY_IDS) {
    byActivity[id] = {
      activity: id,
      sessionsCount: 0,
      completedCount: 0,
      totalPracticed: 0,
      totalCorrect: 0,
      accuracyPercent: 0,
      starsEarned: 0,
      lastPlayedAt: null
    };
  }

  for (const s of sessions) {
    const earned = !s.partial ? (s.stars || 0) : 0;
    totalStars += earned;
    if ((s.endedAt || 0) >= dayStart) {
      todayStars += earned;
    }

    const bucket = byActivity[s.activity];
    if (!bucket) continue;

    bucket.sessionsCount += 1;
    if (!s.partial) bucket.completedCount += 1;
    bucket.totalPracticed += s.practiced || 0;
    bucket.totalCorrect += s.correct || 0;
    bucket.starsEarned += earned;
    if (s.endedAt && (!bucket.lastPlayedAt || s.endedAt > bucket.lastPlayedAt)) {
      bucket.lastPlayedAt = s.endedAt;
    }
  }

  for (const bucket of Object.values(byActivity)) {
    bucket.accuracyPercent = bucket.totalPracticed > 0
      ? Math.round((bucket.totalCorrect / bucket.totalPracticed) * 100)
      : 0;
  }

  return {
    totalStars,
    todayStars,
    dailyMilestoneStars: DAILY_MILESTONE_STARS,
    milestoneReachedToday: todayStars >= DAILY_MILESTONE_STARS,
    totalSessions: sessions.length,
    activities: Object.values(byActivity),
    recentSessions: sessions.slice(0, 10)
  };
}

async function getProgressForChild(guardianId, childId, now = Date.now()) {
  const sessions = await Session.findRecentByGuardian(guardianId, { childId, limit: 1000 });
  return {
    childId,
    ...computeChildProgress(sessions, now)
  };
}

module.exports = {
  DAILY_MILESTONE_STARS,
  computeChildProgress,
  getProgressForChild
};
