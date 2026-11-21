import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HoldToExitButton from '../../components/HoldToExitButton';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, spacing } from '../../theme';
import BreathingStep from './BreathingStep';
import { BREAK_TEXT } from './calmingBreakText';
import MessageStep from './MessageStep';
import SoundsStep from './SoundsStep';

export const STEPS = ['start', 'breathing', 'sounds', 'ready'];

/**
 * Calming break (FR-20, BR-29, BR-30): start -> guided breathing -> soothing sounds (optional) -> ready -> onDone.
 * The break never touches stars or progress (BR-28), so no star counter or store is used here.
 * No Home button: leaving is "hold to exit" only. The trigger that opens this is M-07 logic, not here.
 * initialStep lets the dev gallery open a specific step.
 */
export default function CalmingBreakScreen({ initialStep = 'start', onDone, onExit }) {
  const { child } = useChildProfile();
  const language = child?.language === 'ur' ? 'ur' : 'en';
  const text = BREAK_TEXT[language];
  const [step, setStep] = useState(initialStep);
  const doneRef = useRef(false); // a double tap on "Let's play" calls onDone only once

  let body;
  if (step === 'breathing') {
    body = <BreathingStep language={language} onDone={() => setStep('sounds')} onSkip={() => setStep('ready')} />;
  } else if (step === 'sounds') {
    body = <SoundsStep language={language} onDone={() => setStep('ready')} />;
  } else if (step === 'ready') {
    const finish = () => {
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
    };
    body = <MessageStep message={text.ready} buttonTitle={text.letsPlay} buttonTestID="lets-play" variant="mint" language={language} onPress={finish} />;
  } else {
    body = <MessageStep message={text.start} buttonTitle={text.letsBreathe} buttonTestID="lets-breathe" variant="calm" language={language} onPress={() => setStep('breathing')} />;
  }

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      {body}
      <HoldToExitButton label={text.exit} onExit={onExit} language={language} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.childBackground },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.screen },
});
