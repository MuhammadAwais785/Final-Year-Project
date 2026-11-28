import { computeDashboardStats } from '../m09_dashboard/dashboardStats';

/**
 * Builds a weekly summary report for a single child (M-10, BR-19).
 */
export function buildWeeklyReport({ child, sessions = [], attempts = [], goals = [], rewards, now = Date.now() }) {
  const stats = computeDashboardStats({ sessions, attempts, goals, rewards, now });
  const accuracyPercent = stats.weeklyPracticed > 0
    ? Math.round((stats.weeklyCorrect / stats.weeklyPracticed) * 100)
    : 0;

  return {
    childName: child?.name || '',
    generatedAt: now,
    sessionsCount: stats.weeklySessionsCount,
    minutes: stats.weeklyMinutes,
    practiced: stats.weeklyPracticed,
    correct: stats.weeklyCorrect,
    accuracyPercent,
    starsEarned: stats.weeklyStars,
    totalStars: stats.totalStars,
    goalProgress: stats.goalProgress,
    topHintedPrompts: stats.topHintedPrompts,
  };
}

/**
 * Formats a weekly report as a plain-text summary for Share.share().
 */
export function formatWeeklyReportText(report, language = 'en') {
  if (language === 'ur') {
    return [
      `ہفتہ وار رپورٹ — ${report.childName}`,
      `سیشن: ${report.sessionsCount}`,
      `کل وقت: ${report.minutes} منٹ`,
      `درست الفاظ: ${report.correct}/${report.practiced} (${report.accuracyPercent}%)`,
      `ہفتہ وار ستارے: ${report.starsEarned} (کل: ${report.totalStars})`,
    ].join('\n');
  }

  return [
    `Weekly Progress Report — ${report.childName}`,
    `Sessions: ${report.sessionsCount}`,
    `Practice time: ${report.minutes} min`,
    `Correct words: ${report.correct}/${report.practiced} (${report.accuracyPercent}%)`,
    `Stars earned this week: ${report.starsEarned} (Total: ${report.totalStars})`,
  ].join('\n');
}
