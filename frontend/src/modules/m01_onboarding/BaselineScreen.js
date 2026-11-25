import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import {
  canStartNewBaseline, createBaseline, currentTaskId, MAX_ATTEMPTS, progressPercent, recordSaid, recordSkip, recordTryAgain,
} from './baseline';
import { BASELINE_CHECKLIST } from './baselineChecklist';
import { BASELINE_TEXT, formatDate } from './baselineText';
import { loadInProgress, loadLastCompleted, saveBaseline } from './baselineStore';

const nextAllowedDate = (last, language) => formatDate(new Date(Date.parse(last.completedAt) + 30 * 24 * 60 * 60 * 1000), language);

/**
 * Baseline check (UI-04, FR-2, BR-5, BR-6; design: baseline_screening).
 * The parent asks the child to name each object and taps what happened. Progress is saved
 * after every tap, so "Save and continue later" (or closing the app) resumes at the same task.
 */
export default function BaselineScreen({ childId, checklist = BASELINE_CHECKLIST, onComplete, onExit, onBack, now = Date.now, language: uiLanguage }) {
  const ui = useScreenLanguage(uiLanguage); // the parent's screen language
  const { child } = useChildProfile();
  const id = childId ?? child?._id;
  const t = BASELINE_TEXT[ui];
  const urdu = ui === 'ur';
  const flip = urdu && styles.flip;
  const language = child?.language === 'ur' ? 'ur' : 'en'; // the child's language, for the answer words
  const [baseline, setBaseline] = useState(null);
  const [blockedBy, setBlockedBy] = useState(null); // last completed baseline, when within 30 days

  useEffect(() => {
    let active = true;
    Promise.all([loadInProgress(id), loadLastCompleted(id)]).then(([open, last]) => {
      if (!active) return;
      if (open && open.checklistVersion === checklist.version) setBaseline(open);
      else if (!canStartNewBaseline(last, now())) setBlockedBy(last);
      else setBaseline(createBaseline(id, checklist, now()));
    });
    return () => { active = false; };
  }, [id, checklist, now]);

  const apply = async (step) => {
    const next = step(baseline, now());
    setBaseline(next);
    await saveBaseline(next);
    if (next.status === 'complete') onComplete?.(next);
  };

  const saveAndExit = async () => {
    await saveBaseline(baseline);
    onExit?.();
  };

  if (blockedBy) {
    return <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t.title} onBack={onBack} language={ui} />
      <View style={styles.content}>
        <Text style={[textStyle('body', ui), styles.text]}>{t.blocked(nextAllowedDate(blockedBy, ui))}</Text>
      </View>
    </SafeAreaView>;
  }
  if (!baseline) return <SafeAreaView style={styles.screen} />;

  const task = checklist.tasks.find((x) => x.id === currentTaskId(baseline));
  const percent = progressPercent(baseline);

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title={t.title} onBack={onBack} language={ui} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.progressRow, flip]}>
        <View>
          <Text style={[textStyle('label', ui), styles.accent]}>{t.task(baseline.responses.length + 1, baseline.taskIds.length)}</Text>
          <Text style={[textStyle('labelSm', ui), styles.text]}>{t.attempt(baseline.attempts, MAX_ATTEMPTS)}</Text>
        </View>
        <Text style={[textStyle('labelSm'), styles.percent]}>{percent}%</Text>
      </View>
      <View style={[styles.bar, flip]} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>

      {task && <View style={styles.card}>
        <View style={styles.picture}><Text style={styles.icon}>{task.icon}</Text></View>
        <Text style={[textStyle('headlineSm', ui), styles.text, styles.centred]}>{t.ask}</Text>
        {/* Label in the parent's language, then only the word the child should say, each script in its own Text. */}
        <View style={[styles.answer, flip]}>
          <Text style={[textStyle('label', ui), styles.muted]}>{t.answer}:</Text>
          <Text style={[textStyle('label', language), styles.muted]}>{task.word[language]}</Text>
        </View>
      </View>}

      <View style={styles.actions}>
        <ActionButton testID="said" title={t.said} icon="✓" language={ui} onPress={() => apply(recordSaid)} />
        <ActionButton testID="try-again" title={t.tryAgain} icon="↻" variant="secondary" language={ui} onPress={() => apply(recordTryAgain)} />
        <ActionButton testID="skip" title={t.skip} icon="⏭" variant="tertiary" language={ui} onPress={() => apply(recordSkip)} />
      </View>

      <Pressable testID="save-later" onPress={saveAndExit} accessibilityRole="button" style={styles.later}>
        <Text style={[textStyle('label', ui), styles.accent]}>‖  {t.later}</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  accent: { color: colors.primary },
  flip: { flexDirection: 'row-reverse' },
  centred: { textAlign: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percent: { color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  bar: { height: 10, borderRadius: radius.pill, backgroundColor: colors.parentCard, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  card: { alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.card, ...shadows.card },
  picture: { width: 220, height: 220, borderRadius: radius.input, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 110 },
  answer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { gap: spacing.sm },
  later: { alignSelf: 'center', paddingVertical: spacing.md },
});
