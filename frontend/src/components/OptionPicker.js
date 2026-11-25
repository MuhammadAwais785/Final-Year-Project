import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, textStyle, touch } from '../theme';
import { FieldError, FieldLabel } from './FieldText';

/**
 * Single choice from a few options, shown as equal-width chips in one row (design: add_a_child).
 * options: [{ label, value, language? }]; an option's own language sets its font (e.g. "اردو").
 * In Urdu the chips run right to left.
 * wrap: chips wrap into rows of two (for long labels on narrow phones) instead of one row; words never break.
 */
export default function OptionPicker({ label, options, value, onChange, error, language = 'en', style, wrap = false }) {
  return <View style={style} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {label && <FieldLabel language={language}>{label}</FieldLabel>}
    <View style={[styles.row, wrap && styles.rowWrap, language === 'ur' && styles.rowRtl]}>
      {options.map((option) => {
        const selected = option.value === value;
        return <Pressable
          key={String(option.value)}
          testID={`option-${option.value}`}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ selected }}
          onPress={() => onChange(option.value)}
          style={[styles.chip, wrap ? styles.chipWrap : styles.chipEqual, selected && styles.chipSelected]}>
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
  rowWrap: { flexWrap: 'wrap' },
  rowRtl: { flexDirection: 'row-reverse' },
  chip: {
    minHeight: touch.field,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipEqual: { flex: 1 },
  // 45% basis plus the gap fits exactly two per row; flexGrow fills the rest.
  chipWrap: { flexBasis: '45%', flexGrow: 1 },
  chipSelected: { backgroundColor: colors.primary, ...shadows.raised },
  chipText: { color: colors.text, textAlign: 'center' },
  chipTextSelected: { color: colors.onPrimary },
});
