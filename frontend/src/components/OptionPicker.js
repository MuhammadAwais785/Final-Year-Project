import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../theme';
import { FieldError, FieldLabel } from './FieldText';

/**
 * Single choice from a few options, shown as tappable chips.
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
          <Text style={[textStyle('body', option.language || language), styles.chipText, selected && styles.chipTextSelected]}>
            {option.label}
          </Text>
        </Pressable>;
      })}
    </View>
    <FieldError language={language}>{error}</FieldError>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rowRtl: { flexDirection: 'row-reverse' },
  chip: {
    minWidth: touch.parent,
    minHeight: touch.parent,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, textAlign: 'center' },
  chipTextSelected: { color: colors.onPrimary },
});
