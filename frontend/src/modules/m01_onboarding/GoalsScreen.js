import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import { FieldError } from '../../components/FieldText';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, spacing, textStyle } from '../../theme';
import { GOALS } from '../../utils/constants';
import { loadLastCompleted } from './baselineStore';
import GoalCard from './GoalCard';
import { GOAL_TYPES, addableGoals, suggestGoals, validateGoals } from './goals';
import { GOALS_TEXT } from './goalsText';
import { getGoals, saveGoals } from './goalsStore';

/**
 * Goals (UI-05, FR-3, BR-7; design: goals). Shows the saved goals, or goals suggested from the baseline,
 * and lets the parent edit, add (up to the limit) and remove them. Parent screen: neutral style.
 * `language` is 'en' or 'ur' (shared language setting comes with the Urdu parent screens task).
 */
export default function GoalsScreen({ childId, language = 'en', onSaved, onBack }) {
  const { child } = useChildProfile();
  const id = childId ?? child?._id;
  const t = GOALS_TEXT[language];
  const [goals, setGoals] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const saved = id ? await getGoals(id) : null;
      const baseline = saved || !id ? null : await loadLastCompleted(id);
      if (active) setGoals(saved || suggestGoals(baseline, child?.age));
    })().catch(() => { if (active) setGoals(suggestGoals(null, child?.age)); });
    return () => { active = false; };
  }, [id, child?.age]);

  const edit = (setter) => { setter(); setErrors([]); setSaveError(false); };
  const change = (goalId, fields) => edit(() => setGoals((list) => list.map((g) => (g.id === goalId ? { ...g, ...fields } : g))));
  const remove = (goalId) => edit(() => setGoals((list) => list.filter((g) => g.id !== goalId)));
  const add = (goal) => edit(() => setGoals((list) => [...list, goal]));

  const save = async () => {
    if (busy.current) return; // a second tap before React re-renders
    const result = validateGoals(goals);
    if (!result.valid) { setErrors(result.errors); return; }
    busy.current = true;
    setSaving(true);
    try {
      await saveGoals(id, goals);
      if (mounted.current) onSaved?.(goals);
    } catch {
      if (mounted.current) setSaveError(true);
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  if (!goals) return <SafeAreaView style={styles.screen} />;

  const options = addableGoals(goals);
  const listError = errors.find((e) => e.index === null)?.code;
  const rtl = language === 'ur';

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title={t.title} onBack={onBack} language={language} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[textStyle('body', language), styles.muted]}>{t.intro}</Text>
      {goals.length === 0 && <Text style={[textStyle('body', language), styles.muted]}>{t.empty}</Text>}
      {goals.map((goal, index) => <GoalCard key={goal.id} goal={goal} index={index} language={language}
        error={errors.find((e) => e.index === index)?.code} onChange={change} onRemove={remove} />)}
      <FieldError language={language}>{listError && t.errors[listError]}</FieldError>
      {options.length > 0
        ? <View style={styles.adds}>
          {options.map((goal) => <ActionButton key={goal.type + (goal.skill || '')} testID={`add-${goal.type}`} variant="secondary"
            language={language} icon="+" title={`${t.add}: ${goal.type === GOAL_TYPES.SKILL ? t.skills[goal.skill] : t[goal.type]}`}
            onPress={() => add(goal)} />)}
        </View>
        : goals.length >= GOALS.MAX && <Text testID="goals-full" style={[textStyle('label', language), styles.muted, rtl && styles.right]}>{t.full}</Text>}
      <FieldError language={language}>{saveError && t.saveFailed}</FieldError>
      <ActionButton testID="save-goals" language={language} title={saving ? t.saving : t.save} disabled={saving} onPress={save} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  muted: { color: colors.textMuted },
  right: { textAlign: 'right' },
  adds: { gap: spacing.sm },
});
