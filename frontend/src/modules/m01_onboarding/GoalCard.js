import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FieldError } from '../../components/FieldText';
import OptionPicker from '../../components/OptionPicker';
import TextField from '../../components/TextField';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';
import { GOAL_TYPES, SKILLS } from './goals';
import { GOALS_TEXT } from './goalsText';

/** One editable goal (FR-3; design: goals): a label, the target or skill, a Remove button and inline errors. */
export default function GoalCard({ goal, index, error, language = 'en', onChange, onRemove }) {
  const t = GOALS_TEXT[language];
  const rtl = language === 'ur';
  const isSkill = goal.type === GOAL_TYPES.SKILL;
  const unit = goal.type === GOAL_TYPES.WEEKLY_WORDS ? t.wordsUnit : t.minutesUnit;
  const skillOptions = SKILLS.map((s) => ({ label: t.skillChips[s], value: s, language }));

  return <View testID={`goal-${index}`} style={styles.card}>
    <View style={[styles.head, rtl && styles.rtl]}>
      <Text style={[textStyle('label', language), styles.type]}>{t[goal.type]}</Text>
      <Pressable testID={`remove-${index}`} onPress={() => onRemove(goal.id)} accessibilityRole="button"
        accessibilityLabel={`${t.remove}: ${t[goal.type]}`} hitSlop={spacing.sm} style={styles.remove}>
        <Text style={[textStyle('labelSm', language), styles.removeText]}>{t.remove}</Text>
      </Pressable>
    </View>
    {isSkill
      ? <OptionPicker language={language} options={skillOptions} value={goal.skill} onChange={(skill) => onChange(goal.id, { skill })} />
      : <TextField testID={`target-${index}`} language={language} label={unit} keyboardType="number-pad" maxLength={3}
        value={goal.target == null ? '' : String(goal.target)}
        onChangeText={(text) => onChange(goal.id, { target: text ? parseInt(text.replace(/\D/g, ''), 10) || null : null })} />}
    <FieldError language={language}>{error && t.errors[error]}</FieldError>
  </View>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.card, ...shadows.card },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rtl: { flexDirection: 'row-reverse' },
  type: { color: colors.primary, textTransform: 'uppercase' },
  remove: { minHeight: touch.parent, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface },
  removeText: { color: colors.error },
});
