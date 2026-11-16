/**
 * M04 — Speech AI: Listening Indicator
 *
 * Animated mic button with pulsing ring and waveform bars.
 * Matches the design from docs/design/html/object_naming_game.html exactly.
 *
 * Props:
 *   listening   {boolean}  - is the mic on?
 *   onPress     {function} - tap to start/stop
 *   disabled    {boolean}
 *   language    {'en'|'ur'}
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyle, touch } from '../../theme';

// Number of waveform bars
const BAR_COUNT = 6;
const BAR_HEIGHTS = [12, 20, 28, 20, 24, 14]; // natural waveform shape

function WaveBar({ index, listening }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!listening) {
      Animated.timing(anim, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    // Stagger each bar's animation for a natural wave effect
    const delay = index * 80;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 350,
          delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 350,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, anim, index]);

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, BAR_HEIGHTS[index]],
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height,
          backgroundColor: listening ? colors.primary : `${colors.primary}60`,
        },
      ]}
    />
  );
}

function PulseRing({ listening }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listening) {
      scale.setValue(1);
      opacity.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    opacity.setValue(0.5);
    loop.start();
    return () => loop.stop();
  }, [listening, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function ListeningIndicator({ listening, onPress, disabled, language = 'en' }) {
  const rtl = language === 'ur';
  const label = listening
    ? { en: 'Listening…', ur: '…سن رہا ہوں' }
    : { en: 'Tap to speak', ur: 'بولنے کے لیے دبائیں' };

  return (
    <View style={[styles.row, rtl && styles.rowRtl]}>
      {/* Mic button with pulse */}
      <View style={styles.micWrapper}>
        <PulseRing listening={listening} />
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={rtl ? label.ur : label.en}
          accessibilityState={{ selected: listening }}
          style={({ pressed }) => [
            styles.micButton,
            listening && styles.micActive,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.micIcon}>{listening ? '🎙️' : '🎤'}</Text>
        </Pressable>
      </View>

      {/* Waveform bars */}
      <View style={styles.wave}>
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <WaveBar key={i} index={i} listening={listening} />
        ))}
      </View>

      {/* Status label */}
      <Text
        style={[
          textStyle('headlineSm', language),
          styles.label,
          { color: listening ? colors.primary : colors.textMuted },
        ]}
      >
        {rtl ? label.ur : label.en}
      </Text>
    </View>
  );
}

const MIC_SIZE = touch.child; // 72dp — child touch target

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIC_SIZE,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  rowRtl: { flexDirection: 'row-reverse' },
  micWrapper: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: colors.primary,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: { backgroundColor: colors.primary },
  pressed: { transform: [{ scale: 0.94 }] },
  disabled: { opacity: 0.45 },
  micIcon: { fontSize: 28 },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  label: { flexShrink: 1 },
});
