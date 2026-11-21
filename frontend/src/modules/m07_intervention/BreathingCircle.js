import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, shadows, textStyle } from '../../theme';

const SIZE = 200;
const SMALL = 0.85;
const BIG = 1.4;

/**
 * Soft circle that grows while breathing in and shrinks while breathing out (FR-20, BR-30).
 * Only a slow scale change: no flashing, no sudden contrast. The words stay still in the middle.
 * No microphone is used.
 */
export default function BreathingCircle({ phase, durationMs, label, language = 'en' }) {
  const scale = useRef(new Animated.Value(SMALL)).current;
  const inner = useRef(Animated.multiply(scale, 0.8)).current;

  useEffect(() => {
    const move = Animated.timing(scale, {
      toValue: phase === 'in' ? BIG : SMALL,
      duration: durationMs,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    });
    move.start();
    return () => move.stop();
  }, [phase, durationMs, scale]);

  return <View style={styles.wrap}>
    <Animated.View style={[styles.ring, { transform: [{ scale }] }]} />
    <Animated.View style={[styles.inner, { transform: [{ scale: inner }] }]} />
    <Text accessibilityLiveRegion="polite" style={[textStyle('headlineSm', language), styles.label]}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { width: SIZE * BIG, height: SIZE * BIG, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.lavender, opacity: 0.35 },
  inner: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.card, ...shadows.card },
  label: { color: colors.childText, textAlign: 'center' },
});
