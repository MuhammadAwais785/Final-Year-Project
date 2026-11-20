import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

const DOCTOR = require('../../assets/images/doctor.png');
export const DOCTOR_ASPECT = 489 / 819; // width / height of doctor.png (checked by a test)
const BOUNCE = 8; // dp

/**
 * The Doctor tutor (M-02, FR-4): the same character on every child screen.
 * `size` is his height in dp. While `speaking`, he bounces gently;
 * no movement when the phone's "reduce motion" is on.
 */
export default function DoctorAvatar({ size = 180, speaking = false, language = 'en' }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!speaking || reduceMotion) {
      offset.setValue(0);
      return undefined;
    }
    const step = (toValue) => Animated.timing(offset, { toValue, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(-BOUNCE), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [speaking, reduceMotion, offset]);

  return <Animated.Image
    source={DOCTOR}
    resizeMode="contain"
    accessibilityRole="image"
    accessibilityLabel={language === 'ur' ? 'ڈاکٹر' : 'Doctor'}
    style={[styles.image, { width: Math.round(size * DOCTOR_ASPECT), height: size, transform: [{ translateY: offset }] }]}
  />;
}

const styles = StyleSheet.create({ image: { alignSelf: 'center' } });
