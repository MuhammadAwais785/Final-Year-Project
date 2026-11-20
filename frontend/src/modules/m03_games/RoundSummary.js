import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../components/ActionButton';
import { colors, radius, spacing, textStyle } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';
import MilestoneBadge from './MilestoneBadge';
import { NAMING_TEXT } from './objectNamingText';
import { pickPraise } from './rewardText';

/** End of a round (UI-4): praise, how many were named, stars earned, Play again / Done. */
export default function RoundSummary({ summary, language, milestone = false, onPlayAgain, onDone }) {
  const text = NAMING_TEXT[language];
  const [praise] = useState(() => pickPraise(language)); // picked once so it does not change on re-render
  return <View style={styles.wrap}>
    <DoctorAvatar size={170} language={language} />
    <Text
      accessibilityLabel={language === 'ur' ? `${summary.stars} ${summary.stars === 1 ? 'ستارہ' : 'ستارے'}` : `${summary.stars} stars`}
      style={styles.stars}>{'★'.repeat(Math.min(summary.stars, 12))}</Text>
    <View style={styles.chip}><Text style={[textStyle('label', language), styles.chipText]}>{praise}</Text></View>
    {milestone && <MilestoneBadge language={language} />}
    <Text style={[textStyle('headlineMd', language), styles.title]}>{summary.correct === 0 ? text.tried(summary.practiced) : text.summary(summary.correct, summary.practiced)}</Text>
    <View style={styles.actions}>
      <ActionButton testID="play-again" title={text.playAgain} icon="↻" onPress={onPlayAgain} />
      <ActionButton testID="done" title={text.done} variant="secondary" onPress={onDone} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  stars: { fontSize: 32, color: colors.star, textAlign: 'center' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.mint },
  chipText: { color: colors.onMint },
  title: { color: colors.childText, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm },
});
