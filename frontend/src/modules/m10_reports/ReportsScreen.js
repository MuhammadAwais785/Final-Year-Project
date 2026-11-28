import React, { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { getGoals } from '../m01_onboarding/goalsStore';
import { getRewards } from '../m03_games/rewardStore';
import { getAttempts, getSessions } from '../m03_games/sessionStore';
import { buildWeeklyReport, formatWeeklyReportText } from './weeklyReport';

const REPORT_TEXT = {
  en: {
    title: 'Weekly Report',
    noChild: 'Select or add a child profile to view the weekly report.',
    summaryTitle: 'Last 7 Days Summary',
    sessions: 'Sessions completed',
    minutes: 'Minutes practised',
    accuracy: 'Correct answers',
    stars: 'Stars earned (7d)',
    goalsTitle: 'Goals Status',
    noGoals: 'No goals set yet.',
    share: 'Share Summary',
    pdfNote: 'PDF export will be enabled once the team selects the PDF library.',
  },
  ur: {
    title: 'ہفتہ وار رپورٹ',
    noChild: 'ہفتہ وار رپورٹ دیکھنے کے لیے بچے کا پروفائل منتخب یا شامل کریں۔',
    summaryTitle: 'پچھلے 7 دنوں کا خلاصہ',
    sessions: 'مکمل سیشن',
    minutes: 'مشق کے منٹ',
    accuracy: 'درست جوابات',
    stars: 'حاصل کردہ ستارے (7 دن)',
    goalsTitle: 'اہداف کی صورتحال',
    noGoals: 'ابھی کوئی ہدف مقرر نہیں کیا گیا۔',
    share: 'رپورٹ شیئر کریں',
    pdfNote: 'ٹیم کی طرف سے PDF لائبریری طے ہونے کے بعد PDF ایکسپورٹ شامل کر دی جائے گی۔',
  },
};

/**
 * Weekly summary report screen (M-10, BR-19, UI-8).
 */
export default function ReportsScreen({ childId, onBack, language: languageProp }) {
  const language = useScreenLanguage(languageProp);
  const t = REPORT_TEXT[language];
  const { child } = useChildProfile();
  const activeId = childId ?? child?._id;
  const [report, setReport] = useState(null);

  useEffect(() => {
    let active = true;
    if (!activeId) {
      setReport(null);
      return undefined;
    }

    Promise.all([
      getSessions(activeId),
      getAttempts(activeId),
      getGoals(activeId),
      getRewards(activeId),
    ]).then(([sessions, attempts, goals, rewards]) => {
      if (active) {
        setReport(buildWeeklyReport({ child, sessions, attempts, goals: goals || [], rewards }));
      }
    });

    return () => { active = false; };
  }, [activeId, child]);

  const shareReport = () => {
    if (!report) return;
    Share.share({ message: formatWeeklyReportText(report, language) }).catch(() => {});
  };

  const rtl = language === 'ur';

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title={t.title} onBack={onBack} language={language} />
    <ScrollView contentContainerStyle={styles.content}>
      {!activeId || !report ? (
        <View style={styles.card}><Text style={[textStyle('body', language), styles.muted]}>{t.noChild}</Text></View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={[textStyle('headlineSm', language), styles.heading]}>{t.summaryTitle}</Text>
            <View style={[styles.row, rtl && styles.flip]}>
              <Text style={[textStyle('body', language), styles.muted]}>{t.sessions}</Text>
              <Text style={[textStyle('labelLg', language), styles.text]}>{report.sessionsCount}</Text>
            </View>
            <View style={[styles.row, rtl && styles.flip]}>
              <Text style={[textStyle('body', language), styles.muted]}>{t.minutes}</Text>
              <Text style={[textStyle('labelLg', language), styles.text]}>{report.minutes}</Text>
            </View>
            <View style={[styles.row, rtl && styles.flip]}>
              <Text style={[textStyle('body', language), styles.muted]}>{t.accuracy}</Text>
              <Text style={[textStyle('labelLg', language), styles.text]}>
                {report.correct}/{report.practiced} ({report.accuracyPercent}%)
              </Text>
            </View>
            <View style={[styles.row, rtl && styles.flip]}>
              <Text style={[textStyle('body', language), styles.muted]}>{t.stars}</Text>
              <Text style={[textStyle('labelLg', language), styles.text]}>{report.starsEarned} ★</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[textStyle('headlineSm', language), styles.heading]}>{t.goalsTitle}</Text>
            {report.goalProgress.length === 0 ? (
              <Text style={[textStyle('body', language), styles.muted]}>{t.noGoals}</Text>
            ) : (
              report.goalProgress.map(({ goal, percent }) => (
                <View key={goal.id} style={[styles.row, rtl && styles.flip]}>
                  <Text style={[textStyle('body', language), styles.text]}>{goal.skill || goal.type}</Text>
                  <Text style={[textStyle('label', language), styles.accent]}>{percent}%</Text>
                </View>
              ))
            )}
          </View>

          <ActionButton testID="share-report" title={t.share} language={language} onPress={shareReport} />
          <View style={styles.noteCard}>
            <Text style={[textStyle('label', language), styles.muted]}>{t.pdfNote}</Text>
          </View>
        </>
      )}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  flip: { flexDirection: 'row-reverse' },
  card: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    gap: spacing.sm,
    ...shadows.card,
  },
  noteCard: { padding: spacing.md, borderRadius: radius.input, backgroundColor: colors.surface },
  heading: { color: colors.text },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  accent: { color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
