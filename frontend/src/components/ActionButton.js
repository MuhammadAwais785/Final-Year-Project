import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../theme';

const VARIANTS = {
  primary: { box: { backgroundColor: colors.primary, minHeight: touch.field }, text: { color: colors.onPrimary }, size: 'labelLg' },
  secondary: { box: { backgroundColor: colors.surface, minHeight: 52 }, text: { color: colors.text }, size: 'label' },
  tertiary: { box: { backgroundColor: colors.field, minHeight: touch.parent }, text: { color: colors.textMuted }, size: 'labelSm' },
};

/** Full-width action button in three weights (design: baseline_screening). */
export default function ActionButton({ title, icon, variant = 'primary', onPress, disabled = false, testID }) {
  const v = VARIANTS[variant];
  return <Pressable
    testID={testID}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled }}
    style={({ pressed }) => [styles.box, v.box, pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={[textStyle(v.size), v.text]}>{icon ? `${icon}  ${title}` : title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.input / 4 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
