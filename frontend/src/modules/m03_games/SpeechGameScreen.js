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
import { hintText } from './itemShape';
import { cancelListening, listenForPrompt } from './playPrompt';
import PromptCard from './PromptCard';
import { applyResult, createRound, currentPromptId, pickPrompts, summarize } from './round';
import RoundProgress from './RoundProgress';
import * as defaultRewards from './rewardStore';
import * as defaultSessions from './sessionStore';
import RoundSummary from './RoundSummary';
import { recognizer as defaultRecognizer } from './speech';

// Saves a round as a session. Failures are swallowed: a storage problem must not break the game (UC-5 POST-1).
const persist = (sessions, childId, activity, startedAt, endedAt, state, partial, onSessionSaved) => {
  sessions.saveSession(childId, { activity, startedAt, endedAt, partial, round: state })
    .then((saved) => onSessionSaved?.(saved))
    .catch(() => {});
};

const newRound = (ids, size) => createRound(pickPrompts(ids, size));

/**
 * Shared screen for the speech games: object naming (UC-11) and colour matching (UC-12) (UI-3, UI-4, UI-7).
 * `content` is { itemById(id), itemIds(level), text: { en, ur }, activity }; PromptCard shows an icon or a swatch.
 * Owns the round state and the listen loop: listen -> applyResult -> feedback.
 * phase: 'listening' | 'retry' (message shown, tap the mic) | 'correct' | 'moving_on' | 'done'.
 * recognizer, itemIds and roundSize are props so tests can script the answers.
 */
export default function SpeechGameScreen({
  content,
  recognizer = defaultRecognizer,
  itemIds,
  roundSize = GAME.ROUND_SIZE,
  startStars = 0,
  now = Date.now,
  rewards = defaultRewards,
  sessions = defaultSessions,
  onSessionSaved,
  onDone,
  onExit,
}) {
  const { child } = useChildProfile();
  const language = child?.language === 'ur' ? 'ur' : 'en';
  const text = content.text[language];
  const ids = itemIds ?? content.itemIds();

  const [round, setRound] = useState(() => newRound(ids, roundSize));
  const [shownId, setShownId] = useState(() => currentPromptId(round));
  const [phase, setPhaseState] = useState(round.finished ? 'done' : 'listening');
  const [view, setView] = useState({ feedback: null, earned: 0 });
  const [milestone, setMilestone] = useState(false);
  const roundRef = useRef(round);
  const mountedRef = useRef(true); // no setState after unmount
  const savedRoundRef = useRef(null); // the round whose stars are already saved
  const startedAtRef = useRef(now()); // when the current round began (UC-5 POST-1)
  const phaseRef = useRef(phase); // guards against a double tap before React re-renders
  const item = shownId ? content.itemById(shownId) : null;

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

  useEffect(() => () => { mountedRef.current = false; }, []);

  // Save a round once: the session (UC-5 POST-1) and, if it was finished, its stars (FR-6, FR-8).
  // Keyed by the round object, so re-renders, double taps and exit after Done cannot save twice.
  const childId = child?._id;
  const saveRound = (state) => {
    if (!childId || savedRoundRef.current === state || state.attemptLog.length === 0) return;
    savedRoundRef.current = state;
    persist(sessions, childId, content.activity, startedAtRef.current, now(), state, !state.finished, onSessionSaved);
    const earned = state.finished ? summarize(state).stars : 0;
    if (earned <= 0) return;
    rewards.addStars(childId, earned, now()).then((result) => {
      // only for this round: a late result must not show the badge on the next one
      if (mountedRef.current && roundRef.current === state && result?.milestoneJustReached) setMilestone(true);
    }).catch(() => {}); // a storage failure must not break the summary
  };

  useEffect(() => { if (phase === 'done') saveRound(round); });

  // Leaving without the exit button still keeps the round.
  const saveRoundRef = useRef(saveRound);
  saveRoundRef.current = saveRound;
  useEffect(() => () => saveRoundRef.current(roundRef.current), []);

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
    startedAtRef.current = now();
    setRound(fresh);
    setShownId(currentPromptId(fresh));
    setView({ feedback: null, earned: 0 });
    setMilestone(false);
    setPhase(fresh.finished ? 'done' : 'listening');
  };

  const exit = () => {
    cancelListening(recognizer);
    saveRound(roundRef.current);
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
        ? <RoundSummary text={text} summary={summary} language={language} milestone={milestone} onPlayAgain={playAgain} onDone={onDone} />
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
