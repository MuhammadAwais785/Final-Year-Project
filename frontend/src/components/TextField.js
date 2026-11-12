import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../theme';
import { FieldError, FieldLabel } from './FieldText';

/** Labelled text input with an optional error message. */
export default function TextField({ label, error, language = 'en', style, ...inputProps }) {
  return <View style={style}>
    {label && <FieldLabel language={language}>{label}</FieldLabel>}
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.textMuted}
      style={[textStyle('body', language), styles.input, error && styles.inputError]}
      {...inputProps}
    />
    <FieldError language={language}>{error}</FieldError>
  </View>;
}

const styles = StyleSheet.create({
  input: {
    minHeight: touch.parent,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.input,
  },
  inputError: { borderColor: colors.error },
});
