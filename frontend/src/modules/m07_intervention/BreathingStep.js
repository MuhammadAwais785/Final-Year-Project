import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ActionButton from '../../components/ActionButton';
import { spacing } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';
import BreathingCircle from './BreathingCircle';
import { BREAK_TEXT } from './calmingBreakText';

export const BREATH_MS = 4000; // slow, even rhythm: 4 s in, 4 s out
export const BREATH_CYCLES = 3;

/**
 * Guided breathing (FR-20): in, out, in, out... for a fixed number of cycles, then onDone.
 * "I feel better" lets the child finish early (onSkip). All timers stop on unmount.
 */
export default function BreathingStep({ language, onDone, onSkip, breathMs = BREATH_MS, cycles = BREATH_CYCLES }) {
  const text = BREAK_TEXT[language];
  const [index, setIndex] = useState(0); // even = breathe in, odd = breathe out
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const phase = index % 2 === 0 ? 'in' : 'out';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index + 1 >= cycles * 2) doneRef.current?.();
      else setIndex(index + 1);
    }, breathMs);
    return () => clearTimeout(timer);
  }, [index, breathMs, cycles]);

  return <View style={styles.wrap}>
    <BreathingCircle phase={phase} durationMs={breathMs} label={phase === 'in' ? text.breatheIn : text.breatheOut} language={language} />
    <DoctorAvatar size={150} language={language} />
    <View style={styles.action}>
      <ActionButton testID="feel-better" title={text.feelBetter} variant="calm" language={language} onPress={onSkip} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  action: { alignSelf: 'stretch' },
});
