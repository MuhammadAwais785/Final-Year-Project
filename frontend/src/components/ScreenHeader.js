import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyle, touch } from '../theme';

/** Top bar for Parent Portal screens: back button, title and an optional right-side slot. */
export default function ScreenHeader({ title, onBack, right, language = 'en' }) {
  const rtl = language === 'ur';
  return <View style={[styles.bar, rtl && styles.barRtl]}>
    {onBack && <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel={rtl ? 'واپس' : 'Back'}
      hitSlop={spacing.sm}
      style={styles.back}>
      <Text style={styles.arrow}>{rtl ? '→' : '←'}</Text>
    </Pressable>}
    <Text accessibilityRole="header" numberOfLines={1} style={[textStyle('headlineSm', language), styles.title]}>{title}</Text>
    {right}
  </View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.field,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.parentBackground,
  },
  barRtl: { flexDirection: 'row-reverse' },
  back: { width: touch.parent, height: touch.parent, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 24, color: colors.text },
  title: { flex: 1, color: colors.text },
});
