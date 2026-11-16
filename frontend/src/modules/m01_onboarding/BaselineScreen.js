import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import {
  canStartNewBaseline, createBaseline, currentTaskId, MAX_ATTEMPTS, progressPercent, recordSaid, recordSkip, recordTryAgain,
} from './baseline';
import { BASELINE_CHECKLIST } from './baselineChecklist';
import { loadInProgress, loadLastCompleted, saveBaseline } from './baselineStore';

const nextAllowedDate = (last) => new Date(Date.parse(last.completedAt) + 30 * 24 * 60 * 60 * 1000).toDateString();

/**
 * Baseline check (UI-04, FR-2, BR-5, BR-6; design: baseline_screening).
 * The parent asks the child to name each object and taps what happened. Progress is saved
 * after every tap, so "Save and continue later" (or closing the app) resumes at the same task.
 */
export default function BaselineScreen({ childId, checklist = BASELINE_CHECKLIST, onComplete, onExit, onBack, now = Date.now }) {
  const { child } = useChildProfile();
  const id = childId ?? child?._id;
  const language = child?.language === 'ur' ? 'ur' : 'en';
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
      <ScreenHeader title="Baseline check" onBack={onBack} />
      <View style={styles.content}>
        <Text style={[textStyle('body'), styles.text]}>
          A baseline check was completed recently. The next one can be done from {nextAllowedDate(blockedBy)}.
        </Text>
      </View>
    </SafeAreaView>;
  }
  if (!baseline) return <SafeAreaView style={styles.screen} />;

  const task = checklist.tasks.find((t) => t.id === currentTaskId(baseline));
  const percent = progressPercent(baseline);
  const other = language === 'ur' ? 'en' : 'ur';

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title="Baseline check" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.progressRow}>
        <View>
          <Text style={[textStyle('label'), styles.accent]}>Task {baseline.responses.length + 1} of {baseline.taskIds.length}</Text>
          <Text style={[textStyle('labelSm'), styles.text]}>Attempt {baseline.attempts} of {MAX_ATTEMPTS}</Text>
        </View>
        <Text style={[textStyle('labelSm'), styles.percent]}>{percent}%</Text>
      </View>
      <View style={styles.bar} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>

      {task && <View style={styles.card}>
        <View style={styles.picture}><Text style={styles.icon}>{task.icon}</Text></View>
        <Text style={[textStyle('headlineSm'), styles.text, styles.centred]}>Ask child to name the object</Text>
        {/* Each script in its own Text: Urdu needs a taller line than English or it is clipped. */}
        <View style={styles.answer}>
          <Text style={[textStyle('label', language), styles.muted]}>Answer: {task.word[language]}</Text>
          <Text style={[textStyle('label', other), styles.muted]}>{task.word[other]}</Text>
        </View>
      </View>}

      <View style={styles.actions}>
        <ActionButton testID="said" title="Child said it" icon="✓" onPress={() => apply(recordSaid)} />
        <ActionButton testID="try-again" title="Try again" icon="↻" variant="secondary" onPress={() => apply(recordTryAgain)} />
        <ActionButton testID="skip" title="Skip" icon="⏭" variant="tertiary" onPress={() => apply(recordSkip)} />
      </View>

      <Pressable testID="save-later" onPress={saveAndExit} accessibilityRole="button" style={styles.later}>
        <Text style={[textStyle('label'), styles.accent]}>‖  Save and continue later</Text>
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
