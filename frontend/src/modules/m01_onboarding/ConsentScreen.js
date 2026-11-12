import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldError } from '../../components/FieldText';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenHeader from '../../components/ScreenHeader';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { requestCamera, requestMicrophone } from '../../utils/permissions';
import { DEFAULT_CONSENT, loadConsent, saveConsent } from './consentStore';

export const MESSAGES = {
  micOff: 'Turn on the microphone to use the speech games.',
  micDenied: 'Microphone permission was not allowed. Please allow it to play the speech games.',
  micBlocked: 'The microphone is blocked. Allow it in the phone Settings, then save again.',
  cameraDenied: 'Camera permission was not allowed, so mood monitoring stays off. Tap Save to continue.',
  saveFailed: 'Could not save. Please try again.',
};

function ConsentRow({ testID, icon, iconStyle, title, badge, badgeStyle, badgeTextStyle, description, value, onChange }) {
  return <View style={styles.row}>
    <View style={[styles.rowIcon, iconStyle]}><Text style={styles.rowIconText}>{icon}</Text></View>
    <View style={styles.rowBody}>
      <View style={styles.rowTitle}>
        <Text style={[textStyle('headlineSm'), styles.text]}>{title}</Text>
        <View style={[styles.badge, badgeStyle]}><Text style={[textStyle('labelSm'), badgeTextStyle]}>{badge}</Text></View>
      </View>
      <Text style={[textStyle('label'), styles.muted]}>{description}</Text>
    </View>
    <ToggleSwitch testID={testID} label={title} value={value} onValueChange={onChange} />
  </View>;
}

/**
 * Consent and permissions (UI-03, FR-10, FR-16, BR-24, design: consent_and_permissions).
 * The microphone is required for the speech games; camera mood monitoring is optional and off by default.
 * Saves a versioned consent record for the child and asks the phone for the matching permissions.
 */
export default function ConsentScreen({ childId, onSaved, onBack }) {
  const { child } = useChildProfile();
  const id = childId ?? child?._id;
  const [choices, setChoices] = useState({ audioLocalAllowed: DEFAULT_CONSENT.audioLocalAllowed, cameraAllowed: DEFAULT_CONSENT.cameraAllowed });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    if (id) {
      loadConsent(id).then((saved) => {
        if (active && saved) setChoices({ audioLocalAllowed: saved.audioLocalAllowed, cameraAllowed: saved.cameraAllowed });
      });
    }
    return () => { active = false; };
  }, [id]);

  const set = (field) => (value) => {
    setChoices((c) => ({ ...c, [field]: value }));
    setMessage(null);
  };

  const save = async () => {
    if (busy.current) return;
    if (!choices.audioLocalAllowed) {
      setMessage({ text: MESSAGES.micOff });
      return;
    }
    busy.current = true;
    setSaving(true);
    setMessage(null);
    try {
      const mic = await requestMicrophone();
      if (mic !== 'granted') {
        setMessage(mic === 'blocked' ? { text: MESSAGES.micBlocked, settings: true } : { text: MESSAGES.micDenied });
        return;
      }
      if (choices.cameraAllowed && (await requestCamera()) !== 'granted') {
        setChoices((c) => ({ ...c, cameraAllowed: false }));
        setMessage({ text: MESSAGES.cameraDenied });
        return;
      }
      onSaved?.(await saveConsent(id, choices));
    } catch {
      setMessage({ text: MESSAGES.saveFailed });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title="Consent" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={[textStyle('label'), styles.accent]}>{'\u{1F6E1}︎'} Parental Verification</Text>
        <Text accessibilityRole="header" style={[textStyle('headlineMd'), styles.text]}>Consent and permissions</Text>
        <Text style={[textStyle('body'), styles.muted]}>
          Configure device sensors needed for speech milestones and interactive sessions. You can alter these settings at any time.
        </Text>
      </View>

      <ConsentRow
        testID="consent-microphone"
        icon={'\u{1F3A4}'}
        iconStyle={styles.micIcon}
        title="Microphone"
        badge="Required"
        badgeStyle={styles.requiredBadge}
        badgeTextStyle={styles.requiredBadgeText}
        description="Required for speech games, vocalization tracking, and syllable pronunciation feedback."
        value={choices.audioLocalAllowed}
        onChange={set('audioLocalAllowed')}
      />
      <ConsentRow
        testID="consent-camera"
        icon={'\u{1F4F7}'}
        iconStyle={styles.cameraIcon}
        title="Camera"
        badge="Optional"
        badgeStyle={styles.optionalBadge}
        badgeTextStyle={styles.muted}
        description="Camera for mood monitoring (optional, off by default) to adjust pace during frustration."
        value={choices.cameraAllowed}
        onChange={set('cameraAllowed')}
      />

      <View style={styles.privacy}>
        <View style={styles.privacyIcon}><Text style={styles.privacyIconText}>{'\u{1F6E1}︎'}</Text></View>
        <View style={styles.rowBody}>
          <Text style={[textStyle('label'), styles.privacyTitle]}>Local On-Device Protection</Text>
          <Text style={[textStyle('labelLg'), styles.text]}>Voice and camera are processed only on this phone. Nothing is uploaded.</Text>
        </View>
      </View>

      {message && <View style={styles.message}>
        <FieldError>{message.text}</FieldError>
        {message.settings && <Pressable testID="open-settings" onPress={() => Linking.openSettings()} accessibilityRole="button" style={styles.settings}>
          <Text style={[textStyle('label'), styles.accent]}>Open Settings</Text>
        </Pressable>}
      </View>}

      <PrimaryButton title={saving ? 'Saving…' : 'Save permissions'} onPress={save} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  intro: { gap: spacing.xs },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  accent: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.card, ...shadows.card },
  rowIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  micIcon: { backgroundColor: colors.primarySoft },
  cameraIcon: { backgroundColor: colors.parentCard },
  rowIconText: { fontSize: 20 },
  rowBody: { flex: 1, gap: spacing.xs },
  rowTitle: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  requiredBadge: { backgroundColor: colors.primarySoft },
  requiredBadgeText: { color: colors.onPrimarySoft },
  optionalBadge: { backgroundColor: colors.parentCard },
  privacy: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.privacyBackground },
  privacyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.privacyIcon, alignItems: 'center', justifyContent: 'center' },
  privacyIconText: { fontSize: 18, color: colors.onPrimary },
  privacyTitle: { color: colors.success },
  message: { gap: spacing.xs },
  settings: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
});
