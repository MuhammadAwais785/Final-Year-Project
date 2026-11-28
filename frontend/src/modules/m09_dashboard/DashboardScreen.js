import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchReports } from '../../api/reports';
import ActionButton from '../../components/ActionButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { ACTIVITIES } from '../../utils/constants';
import { getGoals } from '../m01_onboarding/goalsStore';
import { getRewards } from '../m03_games/rewardStore';
import { getAttempts, getSessions } from '../m03_games/sessionStore';
import { computeDashboardStats } from './dashboardStats';

const DASHBOARD_TEXT = {
  en: {
    title: 'Progress Dashboard',
    noChild: 'Select or add a child profile first to view progress.',
    totalStars: 'Total Stars',
    weeklySessions: 'Sessions (7d)',
    weeklyMinutes: 'Minutes (7d)',
    goalsHeading: 'Goals Progress',
    noGoals: 'No goals set yet.',
    weeklyWords: (c, t) => `Weekly words: ${c} / ${t}`,
    dailyMinutes: (c, t) => `Today's practice: ${c} / ${t} min`,
    skillFocus: (s) => `Focus skill: ${s}`,
    skills: {
      naming_objects: 'Naming everyday objects',
      naming_animals: 'Naming animals',
      naming_food: 'Naming food and drink',
      colours: 'Naming colours',
    },
    recentHeading: 'Recent Games',
    noSessions: 'No game sessions recorded yet.',
    activities: {
      [ACTIVITIES.OBJECT_NAMING]: 'Object Naming',
      [ACTIVITIES.COLOUR_MATCHING]: 'Colour Matching',
      [ACTIVITIES.SOUND_IMITATION]: 'Sound Imitation',
    },
    sessionRow: (correct, practiced, stars) => `${correct}/${practiced} words · ${stars} ★`,
    hintsHeading: 'Where Hints Helped Most',
    noHints: 'No hints needed in recorded attempts yet.',
    hintCount: (prompt, hints) => `${prompt}: ${hints} hint${hints === 1 ? '' : 's'}`,
    adaptiveNote: 'Level adjustments and calming break history will appear here once M-06 / M-07 sync events are connected.',
    openReports: 'View Weekly Report',
  },
  ur: {
    title: 'پیش رفت ڈیش بورڈ',
    noChild: 'پیش رفت دیکھنے کے لیے پہلے بچے کا پروفائل منتخب یا شامل کریں۔',
    totalStars: 'کل ستارے',
    weeklySessions: 'سیشن (7 دن)',
    weeklyMinutes: 'منٹ (7 دن)',
    goalsHeading: 'اہداف کی پیش رفت',
    noGoals: 'ابھی کوئی ہدف مقرر نہیں کیا گیا۔',
    weeklyWords: (c, t) => `ہفتہ وار الفاظ: ${c} / ${t}`,
    dailyMinutes: (c, t) => `آج کی مشق: ${c} / ${t} منٹ`,
    skillFocus: (s) => `توجہ کی مہارت: ${s}`,
    skills: {
      naming_objects: 'روزمرہ اشیاء کے نام',
      naming_animals: 'جانوروں کے نام',
      naming_food: 'کھانے پینے کی اشیاء',
      colours: 'رنگوں کے نام',
    },
    recentHeading: 'حالیہ کھیل',
    noSessions: 'ابھی کوئی کھیل ریکارڈ نہیں ہوا۔',
    activities: {
      [ACTIVITIES.OBJECT_NAMING]: 'اشیاء کے نام',
      [ACTIVITIES.COLOUR_MATCHING]: 'رنگ پہچانیں',
      [ACTIVITIES.SOUND_IMITATION]: 'آواز دہرائیں',
    },
    sessionRow: (correct, practiced, stars) => `${correct}/${practiced} الفاظ · ${stars} ★`,
    hintsHeading: 'جہاں اشاروں (Hints) کی ضرورت پڑی',
    noHints: 'ابھی تک کسی کوشش میں اشارے کی ضرورت نہیں پڑی۔',
    hintCount: (prompt, hints) => `${prompt}: ${hints} اشارے`,
    adaptiveNote: 'لیول میں تبدیلی اور پرسکون وقفے کی تفصیل M-06 / M-07 ایونٹس جڑنے کے بعد یہاں نظر آئے گی۔',
    openReports: 'ہفتہ وار رپورٹ دیکھیں',
  },
};

function mergeByKey(localList, remoteList, keyOf) {
  const map = new Map();
  for (const item of remoteList || []) {
    if (item && keyOf(item)) map.set(keyOf(item), item);
  }
  for (const item of localList || []) {
    if (item && keyOf(item)) map.set(keyOf(item), item);
  }
  return Array.from(map.values());
}

/**
 * Parent progress dashboard (M-09, UI-8, BR-19).
 * Displays data for the active child only — never compares two children.
 */
export default function DashboardScreen({ childId, onBack, onOpenReports, language: languageProp }) {
  const language = useScreenLanguage(languageProp);
  const t = DASHBOARD_TEXT[language];
  const { child } = useChildProfile();
  const activeId = childId ?? child?._id;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    if (!activeId) {
      setStats(null);
      return undefined;
    }

    (async () => {
      const [rewards, localSessions, localAttempts, goals] = await Promise.all([
        getRewards(activeId),
        getSessions(activeId),
        getAttempts(activeId),
        getGoals(activeId),
      ]);

      let remoteSessions = [];
      let remoteAttempts = [];
      try {
        const res = await fetchReports(activeId);
        remoteSessions = res?.data?.sessions || [];
        remoteAttempts = res?.data?.attempts || [];
      } catch {
        // Offline or unauthenticated test environment: local phone data still renders.
      }

      const sessions = mergeByKey(localSessions, remoteSessions, (s) => s.clientId);
      const attempts = mergeByKey(
        localAttempts,
        remoteAttempts,
        (a) => `${a.sessionClientId}::${a.promptId}::${a.at}`,
      );

      if (active) {
        setStats(computeDashboardStats({ sessions, attempts, goals: goals || [], rewards }));
      }
    })();

    return () => { active = false; };
  }, [activeId]);

  const rtl = language === 'ur';

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title={t.title} onBack={onBack} language={language} />
    <ScrollView contentContainerStyle={styles.content}>
      {!activeId ? (
        <View style={styles.card}><Text style={[textStyle('body', language), styles.muted]}>{t.noChild}</Text></View>
      ) : (
        <>
          {child?.name && <Text style={[textStyle('headlineMd', language), styles.childName]}>{child.name}</Text>}

          <View style={[styles.kpiRow, rtl && styles.flip]}>
            <View style={styles.kpiCard}>
              <Text style={[textStyle('headlineMd', language), styles.kpiValue]}>{stats?.totalStars ?? 0} ★</Text>
              <Text style={[textStyle('labelSm', language), styles.muted]}>{t.totalStars}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[textStyle('headlineMd', language), styles.kpiValue]}>{stats?.weeklySessionsCount ?? 0}</Text>
              <Text style={[textStyle('labelSm', language), styles.muted]}>{t.weeklySessions}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[textStyle('headlineMd', language), styles.kpiValue]}>{stats?.weeklyMinutes ?? 0}</Text>
              <Text style={[textStyle('labelSm', language), styles.muted]}>{t.weeklyMinutes}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[textStyle('headlineSm', language), styles.heading]}>{t.goalsHeading}</Text>
            {(!stats || stats.goalProgress.length === 0) ? (
              <Text style={[textStyle('body', language), styles.muted]}>{t.noGoals}</Text>
            ) : (
              stats.goalProgress.map(({ goal, current, target, percent }) => {
                let label = t.skillFocus(t.skills[goal.skill] || goal.skill);
                if (goal.type === 'weekly_words') label = t.weeklyWords(current, target);
                if (goal.type === 'daily_minutes') label = t.dailyMinutes(current, target);
                return (
                  <View key={goal.id} style={styles.goalItem}>
                    <Text style={[textStyle('label', language), styles.text]}>{label}</Text>
                    <View style={[styles.bar, rtl && styles.flip]}>
                      <View style={[styles.barFill, { width: `${percent}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={[textStyle('headlineSm', language), styles.heading]}>{t.recentHeading}</Text>
            {(!stats || stats.recentSessions.length === 0) ? (
              <Text style={[textStyle('body', language), styles.muted]}>{t.noSessions}</Text>
            ) : (
              stats.recentSessions.map((session) => (
                <View key={session.clientId} style={[styles.listRow, rtl && styles.flip]}>
                  <Text style={[textStyle('label', language), styles.text]}>
                    {t.activities[session.activity] || session.activity}
                  </Text>
                  <Text style={[textStyle('labelSm', language), styles.muted]}>
                    {t.sessionRow(session.correct, session.practiced, session.stars)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={[textStyle('headlineSm', language), styles.heading]}>{t.hintsHeading}</Text>
            {(!stats || stats.topHintedPrompts.length === 0) ? (
              <Text style={[textStyle('body', language), styles.muted]}>{t.noHints}</Text>
            ) : (
              stats.topHintedPrompts.map((item) => (
                <Text key={item.promptId} style={[textStyle('body', language), styles.text]}>
                  {t.hintCount(item.promptId, item.hints)}
                </Text>
              ))
            )}
          </View>

          <View style={styles.noteCard}>
            <Text style={[textStyle('label', language), styles.muted]}>{t.adaptiveNote}</Text>
          </View>

          {onOpenReports && (
            <ActionButton testID="open-reports" title={t.openReports} language={language} onPress={onOpenReports} />
          )}
        </>
      )}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  flip: { flexDirection: 'row-reverse' },
  childName: { color: colors.text },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.card,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
  },
  kpiValue: { color: colors.primary },
  card: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    gap: spacing.sm,
    ...shadows.card,
  },
  noteCard: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  heading: { color: colors.text },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  goalItem: { gap: spacing.xs },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.parentCard, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
});
