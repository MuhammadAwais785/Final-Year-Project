import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, textStyle, touch } from '../theme';
import { FieldError, FieldLabel } from './FieldText';

/**
 * Single choice from a few options, shown as equal-width chips in one row (design: add_a_child).
 * options: [{ label, value, language? }]; an option's own language sets its font (e.g. "اردو").
 * In Urdu the chips run right to left.
 */
export default function OptionPicker({ label, options, value, onChange, error, language = 'en', style }) {
  return <View style={style} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {label && <FieldLabel language={language}>{label}</FieldLabel>}
    <View style={[styles.row, language === 'ur' && styles.rowRtl]}>
      {options.map((option) => {
        const selected = option.value === value;
        return <Pressable
          key={String(option.value)}
          testID={`option-${option.value}`}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ selected }}
          onPress={() => onChange(option.value)}
          style={[styles.chip, selected && styles.chipSelected]}>
          <Text style={[textStyle('labelLg', option.language || language), styles.chipText, selected && styles.chipTextSelected]}>
            {option.label}
          </Text>
        </Pressable>;
      })}
    </View>
    <FieldError language={language}>{error}</FieldError>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  rowRtl: { flexDirection: 'row-reverse' },
  chip: {
    flex: 1,
    minHeight: touch.field,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, ...shadows.raised },
  chipText: { color: colors.text, textAlign: 'center' },
  chipTextSelected: { color: colors.onPrimary },
});
