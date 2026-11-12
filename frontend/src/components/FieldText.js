import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyle } from '../theme';

/** Small red "!" marker used beside field errors. Decorative: the error text is what screen readers read. */
export function ErrorDot() {
  return <View style={styles.dot} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
    <Text style={styles.dotText}>!</Text>
  </View>;
}

/** Label above a form field. */
export function FieldLabel({ children, language = 'en' }) {
  return <Text style={[textStyle('label', language), styles.label]}>{children}</Text>;
}

/** Error message under a form field. Announced to screen readers when it appears. */
export function FieldError({ children, language = 'en' }) {
  if (!children) return null;
  return <View style={[styles.errorRow, language === 'ur' && styles.rowRtl]}>
    <ErrorDot />
    <Text accessibilityLiveRegion="polite" style={[textStyle('labelSm', language), styles.error]}>{children}</Text>
  </View>;
}

const styles = StyleSheet.create({
  label: { color: colors.text, marginBottom: spacing.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  rowRtl: { flexDirection: 'row-reverse' },
  error: { flexShrink: 1, color: colors.error },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: colors.onPrimary, fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
