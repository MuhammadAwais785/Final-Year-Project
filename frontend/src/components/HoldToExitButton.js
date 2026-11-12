import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyle } from '../theme';

export const HOLD_MS = 1500;

/**
 * Leaves Child Mode only after a deliberate press-and-hold (UC-22 exception 1.0.E1),
 * so a young child cannot exit by tapping. A fill shows how long is left to hold.
 */
export default function HoldToExitButton({ label, onExit, language = 'en', holdMs = HOLD_MS }) {
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const rtl = language === 'ur';

  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
    progress.stopAnimation();
    progress.setValue(0);
  };

  const start = () => {
    cancel();
    Animated.timing(progress, { toValue: 1, duration: holdMs, easing: Easing.linear, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      timer.current = null;
      progress.setValue(0);
      onExit?.();
    }, holdMs);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return <Pressable
    onPressIn={start}
    onPressOut={() => timer.current && cancel()}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={rtl ? 'باہر جانے کے لیے دبا کر رکھیں' : 'Press and hold to leave Child Mode'}
    style={styles.button}>
    <Animated.View style={[styles.fill, rtl ? styles.fillRtl : styles.fillLtr, { width: fillWidth }]} />
    <View style={[styles.row, rtl && styles.rowRtl]}>
      <Text style={styles.lock}>{'\u{1F512}'}</Text>
      <Text style={[textStyle('label', language), styles.label]}>{label}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.exitBorder,
    backgroundColor: colors.exitBackground,
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.exitBorder },
  fillLtr: { left: 0 },
  fillRtl: { right: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowRtl: { flexDirection: 'row-reverse' },
  lock: { fontSize: 14 },
  label: { color: colors.childText },
});
