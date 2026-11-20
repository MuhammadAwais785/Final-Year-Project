import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import HoldToExitButton from '../../components/HoldToExitButton';
import SpeechBubble from '../../components/SpeechBubble';
import StarCounter from '../../components/StarCounter';
import { useChildProfile } from '../../context/ChildProfileContext';
import { GAME } from '../../utils/constants';
import { colors, radius, spacing, textStyle } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';
import ListenControl from './ListenControl';
import { hintText, objectItem, objectItemIds } from './objectNamingContent';
import { NAMING_TEXT } from './objectNamingText';
import { cancelListening, listenForPrompt } from './playPrompt';
import PromptCard from './PromptCard';
import { applyResult, createRound, currentPromptId, pickPrompts, summarize } from './round';
import RoundProgress from './RoundProgress';
import RoundSummary from './RoundSummary';
import { recognizer as defaultRecognizer } from './speech';

const newRound = (ids, size) => createRound(pickPrompts(ids, size));

/**
 * Object naming game (UC-11, UI-3, UI-4, UI-7).
 * Owns the round state and the listen loop: listen -> applyResult -> feedback.
 * phase: 'listening' | 'retry' (message shown, tap the mic) | 'correct' | 'moving_on' | 'done'.
 * recognizer, itemIds and roundSize are props so tests can script the answers.
 */
export default function ObjectNamingScreen({
  recognizer = defaultRecognizer,
  itemIds,
  roundSize = GAME.ROUND_SIZE,
  startStars = 0,
  now = Date.now,
  onDone,
  onExit,
}) {
  const { child } = useChildProfile();
  const language = child?.language === 'ur' ? 'ur' : 'en';
  const text = NAMING_TEXT[language];
  const ids = itemIds ?? objectItemIds();

  const [round, setRound] = useState(() => newRound(ids, roundSize));
  const [shownId, setShownId] = useState(() => currentPromptId(round));
  const [phase, setPhaseState] = useState(round.finished ? 'done' : 'listening');
  const [view, setView] = useState({ feedback: null, earned: 0 });
  const roundRef = useRef(round);
  const phaseRef = useRef(phase); // guards against a double tap before React re-renders
  const item = shownId ? objectItem(shownId) : null;

  const setPhase = (next) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  useEffect(() => {
    if (phase !== 'listening' || !item) return undefined;
    let active = true;
    listenForPrompt(recognizer, item, language, GAME.LISTEN_MS).then((result) => {
      if (!active || !result) return; // cancelled or replaced: not a miss
      const { state, feedback } = applyResult(roundRef.current, result, now());
      roundRef.current = state;
      setRound(state);
      const ended = feedback === 'correct' || feedback === 'moving_on';
      setView({ feedback, earned: ended ? state.results[state.results.length - 1].stars : 0 });
      setPhase(ended ? feedback : 'retry');
    });
    return () => { active = false; };
  }, [phase, item, language, recognizer, now]);

  // A late answer must never reach a screen that is gone (BR-20: nothing is kept either).
  useEffect(() => () => cancelListening(recognizer), [recognizer]);

  const listenAgain = () => {
    if (phaseRef.current !== 'retry') return;
    setPhase('listening');
  };

  const next = () => {
    const state = roundRef.current;
    if (state.finished) {
      setPhase('done');
      return;
    }
    setShownId(currentPromptId(state));
    setPhase('listening');
  };

  const playAgain = () => {
    const fresh = newRound(ids, roundSize);
    roundRef.current = fresh;
    setRound(fresh);
    setShownId(currentPromptId(fresh));
    setView({ feedback: null, earned: 0 });
    setPhase(fresh.finished ? 'done' : 'listening');
  };

  const exit = () => {
    cancelListening(recognizer);
    onExit?.();
  };

  const summary = summarize(round);
  const stars = startStars + summary.stars;
  const total = round.promptIds.length;
  const rtl = language === 'ur';

  let message = text.ask;
  if (phase === 'correct') message = text.correct;
  else if (phase === 'moving_on') message = text.movingOn;
  else if (phase === 'retry') {
    const { feedback } = view;
    message = feedback === 'hint' ? hintText(item, language, round.hintLevel) : feedback === 'unclear' ? text.unclear : text.tryAgain;
  }

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.topBar, rtl && styles.rowRtl]}>
        <RoundProgress total={total} done={phase === 'done' ? total : summary.practiced} language={language} />
        <StarCounter count={stars} language={language} />
      </View>

      {phase === 'done'
        ? <RoundSummary summary={summary} language={language} onPlayAgain={playAgain} onDone={onDone} />
        : <>
          {phase === 'correct' && <View style={styles.earned}>
            <Text style={[textStyle('label', language), styles.earnedText]}>{text.earned(view.earned)}</Text>
          </View>}
          <PromptCard item={item} language={language} correct={phase === 'correct'} />
          <View style={[styles.doctorRow, rtl && styles.rowRtl]}>
            <DoctorAvatar size={110} speaking={phase === 'listening'} language={language} />
            <View style={styles.bubble}><SpeechBubble text={message} language={language} tail="side" variant="childTitle"
              tone={phase === 'retry' && view.feedback === 'hint' ? 'hint' : 'default'} /></View>
          </View>
          {phase === 'correct' || phase === 'moving_on'
            ? <ActionButton testID="next" title={text.next} icon="→" onPress={next} />
            : <ListenControl listening={phase === 'listening'} label={phase === 'listening' ? text.listening : text.speak} language={language} onPress={listenAgain} />}
        </>}

      <HoldToExitButton label={text.exit} onExit={exit} language={language} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.childBackground },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.screen },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRtl: { flexDirection: 'row-reverse' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: { flex: 1 },
  earned: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.clayLight },
  earnedText: { color: colors.onPeach },
});
