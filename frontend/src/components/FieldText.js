import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, textStyle } from '../theme';

/** Label above a form field. */
export function FieldLabel({ children, language = 'en' }) {
  return <Text style={[textStyle('label', language), styles.label]}>{children}</Text>;
}

/** Error message under a form field. Announced to screen readers when it appears. */
export function FieldError({ children, language = 'en' }) {
  if (!children) return null;
  return <Text accessibilityLiveRegion="polite" style={[textStyle('labelSm', language), styles.error]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { color: colors.text, marginBottom: spacing.sm },
  error: { color: colors.error, marginTop: spacing.xs },
});
