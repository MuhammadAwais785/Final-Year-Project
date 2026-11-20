import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../components/ActionButton';
import SpeechBubble from '../../components/SpeechBubble';
import { colors, spacing, textStyle } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';
import { BREAK_TEXT, SOUNDS } from './calmingBreakText';
import SoundTile from './SoundTile';

/**
 * Soothing sounds (optional): choose a calm sound or skip.
 * UI only for now: selecting just highlights the tile. Playback comes later,
 * and nothing is ever recorded (BR-20).
 */
export default function SoundsStep({ language, onDone }) {
  const text = BREAK_TEXT[language];
  const [selected, setSelected] = useState(null);
  return <View style={styles.wrap}>
    <Text accessibilityRole="header" style={[textStyle('headlineMd', language), styles.title]}>{text.soundsTitle}</Text>
    <Text style={[textStyle('body', language), styles.hint]}>{text.soundsHint}</Text>
    <View style={styles.tiles}>
      {SOUNDS.map((s) => <SoundTile key={s.id} testID={`sound-${s.id}`} title={s[language]} icon={s.icon} language={language}
        selected={selected === s.id} onPress={() => setSelected(s.id)} />)}
    </View>
    <View style={styles.doctorRow}>
      <DoctorAvatar size={110} language={language} />
      <View style={styles.bubble}><SpeechBubble text={text.soundsDoctor} language={language} tail="side" variant="label" /></View>
    </View>
    <ActionButton testID="sounds-continue" title={selected ? text.next : text.skip} variant="calm"
      language={language} onPress={onDone} />
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.md },
  title: { color: colors.childText, textAlign: 'center' },
  hint: { color: colors.childText, textAlign: 'center' },
  tiles: { gap: spacing.sm },
  doctorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  bubble: { flexShrink: 1 },
});
