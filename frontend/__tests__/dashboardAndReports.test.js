import { computeDashboardStats, summarizeHintHotspots } from '../src/modules/m09_dashboard/dashboardStats';
import { buildWeeklyReport, formatWeeklyReportText } from '../src/modules/m10_reports/weeklyReport';
import { GOAL_TYPES } from '../src/modules/m01_onboarding/goals';

describe('M-09 Dashboard stats & M-10 Weekly reports', () => {
  const now = new Date('2026-11-28T10:00:00Z').getTime();
  const sessions = [
    {
      clientId: 's1',
      childId: 'c1',
      activity: 'object_naming',
      startedAt: now - 5 * 60000,
      endedAt: now,
      stars: 6,
      practiced: 3,
      correct: 3,
      partial: false,
    },
    {
      clientId: 's2',
      childId: 'c1',
      activity: 'colour_matching',
      startedAt: now - 2 * 24 * 60 * 60000 - 3 * 60000,
      endedAt: now - 2 * 24 * 60 * 60000,
      stars: 3,
      practiced: 3,
      correct: 2,
      partial: false,
    },
    {
      clientId: 's-old',
      childId: 'c1',
      activity: 'object_naming',
      startedAt: now - 10 * 24 * 60 * 60000,
      endedAt: now - 10 * 24 * 60 * 60000 + 4 * 60000,
      stars: 4,
      practiced: 2,
      correct: 2,
      partial: false,
    },
  ];

  const attempts = [
    { sessionClientId: 's1', promptId: 'apple', status: 'recognized', score: 90, hintLevel: 0, at: now },
    { sessionClientId: 's2', promptId: 'blue', status: 'incorrect', score: 40, hintLevel: 1, at: now },
    { sessionClientId: 's2', promptId: 'blue', status: 'recognized', score: 75, hintLevel: 2, at: now },
    { sessionClientId: 's2', promptId: 'red', status: 'recognized', score: 85, hintLevel: 1, at: now },
  ];

  const goals = [
    { id: 'g1', type: GOAL_TYPES.WEEKLY_WORDS, target: 10 },
    { id: 'g2', type: GOAL_TYPES.DAILY_MINUTES, target: 10 },
  ];

  test('computes weekly sessions, minutes, stars, goals progress, and hint hotspots', () => {
    const stats = computeDashboardStats({
      sessions,
      attempts,
      goals,
      rewards: { totalStars: 13, todayStars: 6 },
      now,
    });

    expect(stats.totalStars).toBe(13);
    expect(stats.weeklySessionsCount).toBe(2);
    expect(stats.weeklyMinutes).toBe(8);
    expect(stats.todayMinutes).toBe(5);
    expect(stats.weeklyCorrect).toBe(5);
    expect(stats.goalProgress[0]).toMatchObject({ current: 5, target: 10, percent: 50 });
    expect(stats.goalProgress[1]).toMatchObject({ current: 5, target: 10, percent: 50 });
    expect(stats.recentSessions[0].clientId).toBe('s1');
    expect(summarizeHintHotspots(attempts)[0]).toEqual({ promptId: 'blue', hints: 2, attempts: 2 });
  });

  test('builds and formats weekly report in English and Urdu', () => {
    const report = buildWeeklyReport({
      child: { name: 'Ali' },
      sessions,
      attempts,
      goals,
      rewards: { totalStars: 13, todayStars: 6 },
      now,
    });

    expect(report.accuracyPercent).toBe(83);
    expect(report.starsEarned).toBe(9);
    expect(formatWeeklyReportText(report, 'en')).toContain('Weekly Progress Report — Ali');
    expect(formatWeeklyReportText(report, 'ur')).toContain('ہفتہ وار رپورٹ — Ali');
  });
});
