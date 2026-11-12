import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameTile from '../../components/GameTile';
import HoldToExitButton from '../../components/HoldToExitButton';
import SpeechBubble from '../../components/SpeechBubble';
import StarCounter from '../../components/StarCounter';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, fonts, radius, spacing, textStyle } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';

// The three speech games (UC-11, UC-12, UC-13).
export const GAMES = [
  { id: 'objectNaming', icon: '\u{1F34E}', tone: 'sky', title: { en: 'What is this?', ur: 'یہ کیا ہے؟' } },
  { id: 'colourMatching', icon: '\u{1F3A8}', tone: 'peach', title: { en: 'Colours', ur: 'رنگ' } },
  { id: 'soundImitation', icon: '\u{1F442}', tone: 'mint', title: { en: 'Copy the sound', ur: 'آواز دہرائیں' } },
];

const TEXT = {
  en: { greeting: (name) => (name ? `Hello ${name}! Let's play!` : "Hello! Let's play!"), kid: 'Kid', exit: 'Grown-ups: hold to exit' },
  ur: { greeting: (name) => (name ? `ہیلو ${name}! آئیں کھیلیں!` : 'ہیلو! آئیں کھیلیں!'), kid: null, exit: 'والدین: باہر نکلنے کے لیے دبا کر رکھیں' },
};

/**
 * Child Mode home (UI-06, design: child_mode_voice_games_english / _urdu).
 * Shows the active child's name, stars, the Doctor's greeting and the three games,
 * in the child's own language (BR-3). There is no other way out than holding the exit button.
 */
export default function ChildHomeScreen({ stars = 0, onSelectGame, onExit }) {
  const { child } = useChildProfile();
  const language = child?.language === 'ur' ? 'ur' : 'en';
  const text = TEXT[language];
  const rtl = language === 'ur';
  const name = child?.name ?? '';

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.topBar, rtl && styles.rowRtl]}>
        <View style={[styles.kidChip, rtl && styles.rowRtl]}>
          <View style={styles.kidFace}><Text style={styles.kidFaceIcon}>{'☺︎'}</Text></View>
          <View>
            {text.kid && <Text style={styles.kidLabel}>{text.kid.toUpperCase()}</Text>}
            <Text style={[textStyle('headlineSm', language), styles.kidName]}>{name}</Text>
          </View>
        </View>
        <StarCounter count={stars} language={language} />
      </View>

      <View style={styles.doctorArea}>
        <SpeechBubble text={text.greeting(name)} language={language} variant="childTitle" />
        <DoctorAvatar size={190} language={language} />
      </View>

      <View style={styles.tiles}>
        {GAMES.map((game) => <GameTile
          key={game.id}
          testID={`game-${game.id}`}
          title={game.title[language]}
          icon={game.icon}
          tone={game.tone}
          language={language}
          onPress={() => onSelectGame?.(game.id)}
        />)}
      </View>

      <HoldToExitButton label={text.exit} onExit={onExit} language={language} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.childBackground },
  content: { flexGrow: 1, justifyContent: 'space-between', gap: spacing.lg, padding: spacing.screen },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRtl: { flexDirection: 'row-reverse' },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.childChipBorder,
    backgroundColor: colors.card,
  },
  kidFace: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' },
  kidFaceIcon: { fontSize: 18, color: colors.onPeach },
  kidLabel: { fontFamily: fonts.en[700], fontSize: 10, lineHeight: 12, letterSpacing: 1, color: colors.onPeach },
  kidName: { color: colors.childText },
  doctorArea: { alignItems: 'center', gap: spacing.md },
  tiles: { gap: spacing.md },
});
