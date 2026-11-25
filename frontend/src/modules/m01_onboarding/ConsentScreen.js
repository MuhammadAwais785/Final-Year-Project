import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldError } from '../../components/FieldText';
import SubmitButton from '../../components/SubmitButton';
import ScreenHeader from '../../components/ScreenHeader';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useChildProfile } from '../../context/ChildProfileContext';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { requestCamera, requestMicrophone } from '../../utils/permissions';
import { CONSENT_TEXT } from './consentText';
import { DEFAULT_CONSENT, loadConsent, saveConsent } from './consentStore';

// English messages stay exported for tests and callers.
export const MESSAGES = CONSENT_TEXT.en.messages;

function ConsentRow({ language, testID, icon, iconStyle, title, badge, badgeStyle, badgeTextStyle, description, value, onChange }) {
  const flip = language === 'ur' && styles.flip;
  return <View style={[styles.row, flip]}>
    <View style={[styles.rowIcon, iconStyle]}><Text style={styles.rowIconText}>{icon}</Text></View>
    <View style={styles.rowBody}>
      <View style={[styles.rowTitle, flip]}>
        <Text style={[textStyle('headlineSm', language), styles.text]}>{title}</Text>
        <View style={[styles.badge, badgeStyle]}><Text style={[textStyle('labelSm', language), badgeTextStyle]}>{badge}</Text></View>
      </View>
      <Text style={[textStyle('label', language), styles.muted]}>{description}</Text>
    </View>
    <ToggleSwitch testID={testID} label={title} value={value} onValueChange={onChange} />
  </View>;
}

/**
 * Consent and permissions (UI-03, FR-10, FR-16, BR-24, design: consent_and_permissions).
 * The microphone is required for the speech games; camera mood monitoring is optional and off by default.
 * Saves a versioned consent record for the child and asks the phone for the matching permissions.
 */
export default function ConsentScreen({ childId, onSaved, onBack, language }) {
  const lang = useScreenLanguage(language);
  const t = CONSENT_TEXT[lang];
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
      setMessage({ key: 'micOff' });
      return;
    }
    busy.current = true;
    setSaving(true);
    setMessage(null);
    try {
      const mic = await requestMicrophone();
      if (mic !== 'granted') {
        setMessage(mic === 'blocked' ? { key: 'micBlocked', settings: true } : { key: 'micDenied' });
        return;
      }
      if (choices.cameraAllowed && (await requestCamera()) !== 'granted') {
        setChoices((c) => ({ ...c, cameraAllowed: false }));
        setMessage({ key: 'cameraDenied' });
        return;
      }
      onSaved?.(await saveConsent(id, choices));
    } catch {
      setMessage({ key: 'saveFailed' });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const flip = lang === 'ur' && styles.flip;
  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title={t.title} onBack={onBack} language={lang} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={[textStyle('label', lang), styles.accent]}>{'\u{1F6E1}︎'} {t.verification}</Text>
        <Text accessibilityRole="header" style={[textStyle('headlineMd', lang), styles.text]}>{t.heading}</Text>
        <Text style={[textStyle('body', lang), styles.muted]}>{t.intro}</Text>
      </View>

      <ConsentRow
        language={lang}
        testID="consent-microphone"
        icon={'\u{1F3A4}'}
        iconStyle={styles.micIcon}
        title={t.microphone}
        badge={t.required}
        badgeStyle={styles.requiredBadge}
        badgeTextStyle={styles.requiredBadgeText}
        description={t.microphoneInfo}
        value={choices.audioLocalAllowed}
        onChange={set('audioLocalAllowed')}
      />
      <ConsentRow
        language={lang}
        testID="consent-camera"
        icon={'\u{1F4F7}'}
        iconStyle={styles.cameraIcon}
        title={t.camera}
        badge={t.optional}
        badgeStyle={styles.optionalBadge}
        badgeTextStyle={styles.muted}
        description={t.cameraInfo}
        value={choices.cameraAllowed}
        onChange={set('cameraAllowed')}
      />

      <View style={[styles.privacy, flip]}>
        <View style={styles.privacyIcon}><Text style={styles.privacyIconText}>{'\u{1F6E1}︎'}</Text></View>
        <View style={styles.rowBody}>
          <Text style={[textStyle('label', lang), styles.privacyTitle]}>{t.privacyTitle}</Text>
          <Text style={[textStyle('labelLg', lang), styles.text]}>{t.privacyInfo}</Text>
        </View>
      </View>

      {message && <View style={styles.message}>
        <FieldError language={lang}>{t.messages[message.key]}</FieldError>
        {message.settings && <Pressable testID="open-settings" onPress={() => Linking.openSettings()} accessibilityRole="button" style={[styles.settings, flip && styles.settingsRtl]}>
          <Text style={[textStyle('label', lang), styles.accent]}>{t.openSettings}</Text>
        </Pressable>}
      </View>}

      <SubmitButton language={lang} title={saving ? t.saving : t.save} onPress={save} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.md },
  flip: { flexDirection: 'row-reverse' },
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
  settingsRtl: { alignSelf: 'flex-end' },
});
