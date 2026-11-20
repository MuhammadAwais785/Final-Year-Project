import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../theme';
import { ErrorDot, FieldError, FieldLabel } from './FieldText';

/** Labelled text input with an optional error message (design: add_a_child). */
export default function TextField({ label, error, language = 'en', style, ...inputProps }) {
  const rtl = language === 'ur';
  return <View style={style}>
    {label && <FieldLabel language={language}>{label}</FieldLabel>}
    <View style={[styles.box, rtl && styles.boxRtl]}>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[textStyle('body', language), styles.input]}
        {...inputProps}
      />
      {error && <ErrorDot />}
    </View>
    <FieldError language={language}>{error}</FieldError>
  </View>;
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.field,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.field,
    borderRadius: radius.input,
  },
  boxRtl: { flexDirection: 'row-reverse' },
  input: { flex: 1, color: colors.text, paddingVertical: 0 },
});
