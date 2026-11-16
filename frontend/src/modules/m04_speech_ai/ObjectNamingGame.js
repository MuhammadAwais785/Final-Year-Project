/**
 * M04 — Speech AI: Object Naming Game
 *
 * Design reference: docs/design/html/object_naming_game.html
 *                   docs/design/html/object_naming_game_correct.html
 *                   docs/design/html/object_naming_game_hint.html
 *                   docs/design/html/object_naming_game_summary.html
 *
 * Flow:
 *   PROMPT  → show image + Doctor asking "What is this?"
 *   LISTEN  → child taps mic → listening indicator animates
 *   RESULT  → correct (star) or hint (try again)
 *   SUMMARY → after all rounds, show total score
 *
 * Props:
 *   childId   {string}
 *   language  {'en'|'ur'}
 *   stars     {number}       - current star count (from parent)
 *   onAddStar {function}     - called when child earns a star
 *   onExit    {function}     - hold-to-exit callback
 */

import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HoldToExitButton from '../../components/HoldToExitButton';
import SpeechBubble from '../../components/SpeechBubble';
import StarCounter from '../../components/StarCounter';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';
import ListeningIndicator from './ListeningIndicator';
import { saveSession } from './speechStore';
import useSpeech from './useSpeech';

// ─── Word list ────────────────────────────────────────────────────────────────
// Each item: image asset, English keyword, Urdu keyword.
// Add more words here as the vocabulary grows.
const WORDS = [
  {
    id: 'apple',
    image: require('../../assets/images/words/apple.png'),
    en: 'apple',
    ur: 'سیب',
    emoji: '🍎',
  },
  {
    id: 'ball',
    image: require('../../assets/images/words/ball.png'),
    en: 'ball',
    ur: 'گیند',
    emoji: '⚽',
  },
  {
    id: 'cat',
    image: require('../../assets/images/words/cat.png'),
    en: 'cat',
    ur: 'بلی',
    emoji: '🐱',
  },
  {
    id: 'dog',
    image: require('../../assets/images/words/dog.png'),
    en: 'dog',
    ur: 'کتا',
    emoji: '🐶',
  },
  {
    id: 'book',
    image: require('../../assets/images/words/book.png'),
    en: 'book',
    ur: 'کتاب',
    emoji: '📚',
  },
];

const ROUNDS = 5; // how many words per game session

// ─── UI text (bilingual) ──────────────────────────────────────────────────────
const TEXT = {
  en: {
    question: 'What is this?',
    correct: (word) => `Yes! It's a ${word}! ⭐`,
    hint: (word) => `Try saying: "${word}"`,
    noMic: 'Microphone not available. Tap the button to try again.',
    summary: (score, total) => `You got ${score} out of ${total}!`,
    summaryTitle: 'Well done!',
    playAgain: 'Play again ▶',
    exit: 'Grown-ups: hold to exit',
    round: (n, total) => `Round ${n} of ${total}`,
  },
  ur: {
    question: 'یہ کیا ہے؟',
    correct: (word) => `ہاں! یہ ${word} ہے! ⭐`,
    hint: (word) => `کہیں: "${word}"`,
    noMic: 'مائکروفون دستیاب نہیں۔ دوبارہ کوشش کریں۔',
    summary: (score, total) => `آپ نے ${score} میں سے ${total} صحیح کیے!`,
    summaryTitle: 'شاباش!',
    playAgain: 'دوبارہ کھیلیں ▶',
    exit: 'والدین: باہر نکلنے کے لیے دبا کر رکھیں',
    round: (n, total) => `دور ${n} از ${total}`,
  },
};

// ─── State machine ────────────────────────────────────────────────────────────
const PHASES = { PROMPT: 'PROMPT', LISTEN: 'LISTEN', CORRECT: 'CORRECT', HINT: 'HINT', SUMMARY: 'SUMMARY' };

function pickWords() {
  // Shuffle and pick ROUNDS words
  return [...WORDS].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
}

const initialState = {
  phase: PHASES.PROMPT,
  roundIndex: 0,
  words: pickWords(),
  starsEarned: 0,
  results: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'START_LISTEN':
      return { ...state, phase: PHASES.LISTEN };
    case 'CORRECT':
      return {
        ...state,
        phase: PHASES.CORRECT,
        starsEarned: state.starsEarned + 1,
        results: [...state.results, { word: state.words[state.roundIndex].id, score: action.score, correct: true }],
      };
    case 'WRONG':
      return {
        ...state,
        phase: PHASES.HINT,
        results: [...state.results, { word: state.words[state.roundIndex].id, score: action.score, correct: false }],
      };
    case 'NEXT_ROUND': {
      const next = state.roundIndex + 1;
      if (next >= state.words.length) return { ...state, phase: PHASES.SUMMARY };
      return { ...state, phase: PHASES.PROMPT, roundIndex: next };
    }
    case 'RESTART':
      return { ...initialState, words: pickWords() };
    default:
      return state;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ total, current, style }) {
  return (
    <View style={[styles.dots, style]}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i <= current && styles.dotDone]} />
      ))}
    </View>
  );
}

function ResultBanner({ visible, success, text, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[styles.banner, success ? styles.bannerGood : styles.bannerHint, style, { opacity }]}>
      <Text style={[textStyle('headlineSm'), styles.bannerText]}>{text}</Text>
    </Animated.View>
  );
}

function WordCard({ word, language }) {
  const rtl = language === 'ur';
  const displayLabel = language === 'ur' ? word.ur : word.en;

  // Try to load the image; fall back to emoji if asset is missing
  const [imgError, setImgError] = React.useState(false);

  return (
    <View style={styles.wordCard}>
      {imgError ? (
        <Text style={styles.wordEmoji}>{word.emoji}</Text>
      ) : (
        <Image
          source={word.image}
          style={styles.wordImage}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      )}
      <Text style={[textStyle('display', language), styles.wordLabel]}>
        {language === 'en' ? word.en : word.ur}
      </Text>
      {/* Show the other language as subtitle */}
      <Text style={[textStyle('body', rtl ? 'en' : 'ur'), styles.wordSub]}>
        {language === 'en' ? word.ur : word.en}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ObjectNamingGame({ childId, stars = 0, onAddStar, onExit }) {
  const { child } = useChildProfile();
  const language = child?.language === 'ur' ? 'ur' : 'en';
  const rtl = language === 'ur';
  const t = TEXT[language];

  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, roundIndex, words, starsEarned } = state;
  const currentWord = words[roundIndex];

  const handleScore = useCallback(
    ({ score, label }) => {
      const correct = label === 'perfect' || label === 'good';
      if (correct) {
        dispatch({ type: 'CORRECT', score });
        onAddStar?.();
        // Save to store
        saveSession({
          childId,
          word: currentWord.id,
          language,
          transcript: '', // updated below by hook
          score,
          label,
          gameId: 'objectNaming',
        });
      } else {
        dispatch({ type: 'WRONG', score });
      }
    },
    [childId, currentWord, language, onAddStar],
  );

  const { listening, transcript, score, feedback, error, available, startListening, stopListening, reset } =
    useSpeech({
      expectedWord: language === 'ur' ? currentWord?.ur : currentWord?.en,
      language,
      onScore: handleScore,
    });

  // Reset speech hook when round changes
  useEffect(() => {
    reset();
  }, [roundIndex, reset]);

  // Auto-advance after correct / hint phases
  useEffect(() => {
    if (phase === PHASES.CORRECT || phase === PHASES.HINT) {
      const timer = setTimeout(() => dispatch({ type: 'NEXT_ROUND' }), 2200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // ── Summary screen ──
  if (phase === PHASES.SUMMARY) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.summaryContent}>
          <View style={styles.summaryCard}>
            <Text style={[textStyle('display', language), styles.summaryTitle]}>{t.summaryTitle}</Text>
            <Text style={styles.summaryEmoji}>🌟</Text>
            <Text style={[textStyle('headlineMd', language), styles.summaryScore]}>
              {t.summary(starsEarned, words.length)}
            </Text>
            <ProgressDots total={words.length} current={words.length - 1} style={styles.summaryDots} />
          </View>
          <Pressable
            onPress={() => dispatch({ type: 'RESTART' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.playAgainBtn, pressed && styles.pressed]}
          >
            <Text style={[textStyle('labelLg'), styles.playAgainText]}>{t.playAgain}</Text>
          </Pressable>
          <HoldToExitButton label={t.exit} onExit={onExit} language={language} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Game screen ──
  const isCorrect = phase === PHASES.CORRECT;
  const isHint = phase === PHASES.HINT;
  const doctorText =
    isCorrect
      ? t.correct(language === 'ur' ? currentWord.ur : currentWord.en)
      : isHint
        ? t.hint(language === 'ur' ? currentWord.ur : currentWord.en)
        : t.question;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={[styles.topBar, rtl && styles.rowRtl]}>
          <ProgressDots total={words.length} current={roundIndex} />
          <Text style={[textStyle('labelSm', language), styles.roundLabel]}>
            {t.round(roundIndex + 1, words.length)}
          </Text>
          <StarCounter count={stars} language={language} />
        </View>

        {/* Word card */}
        <WordCard word={currentWord} language={language} />

        {/* Result banner */}
        <ResultBanner
          visible={isCorrect || isHint}
          success={isCorrect}
          text={
            isCorrect
              ? t.correct(language === 'ur' ? currentWord.ur : currentWord.en)
              : t.hint(language === 'ur' ? currentWord.ur : currentWord.en)
          }
        />

        {/* Doctor + speech bubble */}
        <View style={[styles.doctorRow, rtl && styles.rowRtl]}>
          <DoctorAvatar size={110} speaking={listening} language={language} />
          <SpeechBubble
            text={doctorText}
            language={language}
            tail="side"
            variant="headlineSm"
            onReplay={phase === PHASES.PROMPT ? () => { /* TTS hook will go here in M04-b */ } : undefined}
          />
        </View>

        {/* Listening indicator */}
        {!isCorrect && !isHint && (
          <ListeningIndicator
            listening={listening}
            onPress={listening ? stopListening : startListening}
            disabled={!available || isCorrect || isHint}
            language={language}
          />
        )}

        {/* Error/no-mic message */}
        {(error || !available) && (
          <View style={styles.errorBox}>
            <Text style={[textStyle('label', language), styles.errorText]}>
              {t.noMic}
            </Text>
          </View>
        )}

        {/* Transcript (debug-style, hidden when empty) */}
        {!!transcript && phase === PHASES.LISTEN && (
          <Text style={[textStyle('body'), styles.transcript]}>"{transcript}"</Text>
        )}

        <HoldToExitButton label={t.exit} onExit={onExit} language={language} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.childBackground },
  content: { flexGrow: 1, padding: spacing.screen, gap: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRtl: { flexDirection: 'row-reverse' },
  roundLabel: { color: colors.textMuted },

  // Progress dots
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: `${colors.primary}30` },
  dotDone: { backgroundColor: colors.primary },

  // Word card
  wordCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadows.raised,
  },
  wordImage: { width: 180, height: 180 },
  wordEmoji: { fontSize: 100, textAlign: 'center' },
  wordLabel: { color: colors.text, textAlign: 'center' },
  wordSub: { color: colors.textMuted, textAlign: 'center' },

  // Result banner
  banner: {
    padding: spacing.md,
    borderRadius: radius.input,
    alignItems: 'center',
  },
  bannerGood: { backgroundColor: colors.mint },
  bannerHint: { backgroundColor: colors.peach },
  bannerText: { color: colors.text, textAlign: 'center' },

  // Doctor area
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },

  // Error
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.errorLight,
  },
  errorText: { color: colors.error, textAlign: 'center' },

  // Transcript
  transcript: { color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },

  // Summary
  summaryContent: { flexGrow: 1, padding: spacing.screen, gap: spacing.lg, justifyContent: 'center' },
  summaryCard: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadows.raised,
  },
  summaryTitle: { color: colors.text, textAlign: 'center' },
  summaryEmoji: { fontSize: 72, textAlign: 'center' },
  summaryScore: { color: colors.primary, textAlign: 'center' },
  summaryDots: { justifyContent: 'center' },

  // Play again
  playAgainBtn: {
    minHeight: touch.childMain,
    borderRadius: 9999,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    ...shadows.card,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  playAgainText: { color: colors.onMint },
});
