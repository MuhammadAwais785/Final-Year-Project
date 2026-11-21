import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Waveform from '../../components/Waveform';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';

/**
 * While listening: a visible "Listening…" indicator (UI-3).
 * Otherwise: a big mic button to listen again (UI-7).
 */
export default function ListenControl({ listening, label, language, onPress }) {
  const rtl = language === 'ur';
  const body = <>
    <View style={styles.mic}><Text style={styles.micIcon}>{'\u{1F3A4}'}</Text></View>
    {listening && <Waveform active />}
    <Text style={[textStyle('labelLg', language), styles.label]}>{label}</Text>
  </>;
  if (listening) {
    return <View testID="listening" accessibilityRole="progressbar" accessibilityLabel={label} style={[styles.pill, rtl && styles.rtl]}>{body}</View>;
  }
  return <Pressable testID="listen-button" accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.pill, rtl && styles.rtl, pressed && styles.pressed]}>{body}</Pressable>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.md,
    minHeight: touch.childMain,
    padding: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadows.raised,
  },
  rtl: { flexDirection: 'row-reverse' },
  pressed: { opacity: 0.85 },
  mic: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 28 },
  label: { flexShrink: 1, color: colors.childText },
});
