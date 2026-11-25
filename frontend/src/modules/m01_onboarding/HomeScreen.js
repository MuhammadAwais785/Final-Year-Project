import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageToggle from '../../components/LanguageToggle';
import { useLanguage, useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';
import { HOME_TEXT } from './homeText';

/**
 * English mode: English line above its Urdu line, as in the design. Urdu mode: the Urdu line only,
 * right to left (UI-8). Each script is its own Text, never nested.
 */
function Bilingual({ en, ur, variant, enColor, urColor = enColor, centred, urduOnly }) {
  const align = centred ? styles.centred : null;
  return <View>
    {!urduOnly && <Text style={[textStyle(variant), { color: enColor }, align]}>{en}</Text>}
    <Text style={[textStyle(variant, 'ur'), { color: urduOnly ? enColor : urColor }, align]}>{ur}</Text>
  </View>;
}

function ModeCard({ testID, title, icon, iconStyle, cardStyle, titleColor, urColor, button, buttonColor, onPress, disabled, urduOnly }) {
  const flip = urduOnly && styles.flip;
  return <View style={[styles.card, cardStyle]}>
    <View style={[styles.cardTop, flip]}>
      <Bilingual en={title.en} ur={title.ur} variant="headlineSm" enColor={titleColor} urColor={urColor} urduOnly={urduOnly} />
      <View style={[styles.cardIcon, iconStyle]}><Text style={styles.cardIconText}>{icon}</Text></View>
    </View>
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={urduOnly ? `${title.ur}: ${button.ur}` : `${title.en}: ${button.en}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.cardButton, flip, { backgroundColor: buttonColor }, pressed && styles.pressed, disabled && styles.disabled]}>
      {!urduOnly && <Text style={[textStyle('labelLg'), styles.onButton]}>{button.icon}  {button.en}</Text>}
      <Text style={[textStyle('bodyLg', 'ur'), styles.onButton]}>{button.ur}</Text>
      {urduOnly && <Text style={[textStyle('labelLg'), styles.onButton]}>{button.icon}</Text>}
    </Pressable>
  </View>;
}

/**
 * Home (UI-1, design: app_home_mode_selection): two clearly separated entry points,
 * Child Mode and the PIN-protected Parent Portal. Child Mode needs a child profile first.
 * `language` (else the shared parent language) picks English-with-Urdu or Urdu only (UI-8).
 */
export default function HomeScreen({ onChildMode, onParentPortal, childModeAvailable = true, language, onLanguageChange }) {
  const lang = useScreenLanguage(language);
  const { setLanguage } = useLanguage();
  const u = HOME_TEXT.ur;
  const urduOnly = lang === 'ur';
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <LanguageToggle style={styles.toggle} language={lang} onChange={onLanguageChange || setLanguage} />

      <View style={styles.brand}>
        <View style={styles.brandIcon}><Text style={styles.brandIconText}>{'\u{1F5E3}︎'}</Text></View>
        <Bilingual en={HOME_TEXT.en.appName} ur={u.appName} variant="headlineMd" enColor={colors.text} urColor={colors.primary} centred urduOnly={urduOnly} />
        <View style={styles.tagline}>
          <Bilingual en={HOME_TEXT.en.tagline} ur={u.tagline} variant="label" enColor={colors.textMuted} urColor={colors.success} centred urduOnly={urduOnly} />
        </View>
      </View>

      <ModeCard
        testID="child-mode"
        title={{ en: HOME_TEXT.en.childMode, ur: u.childMode }}
        icon={'\u{1F388}'}
        cardStyle={styles.childCard}
        iconStyle={styles.childIcon}
        titleColor={colors.onChildCard}
        urColor={colors.clayDark}
        button={{ en: HOME_TEXT.en.start, ur: u.start, icon: '▶' }}
        buttonColor={colors.clayDark}
        onPress={onChildMode}
        disabled={!childModeAvailable}
        urduOnly={urduOnly}
      />
      {!childModeAvailable && <Bilingual
        en={HOME_TEXT.en.needChild}
        ur={u.needChild}
        variant="label"
        enColor={colors.textMuted}
        centred
        urduOnly={urduOnly}
      />}

      <ModeCard
        testID="parent-portal"
        title={{ en: HOME_TEXT.en.parentPortal, ur: u.parentPortal }}
        icon={'\u{1F512}'}
        cardStyle={styles.parentCard}
        iconStyle={styles.parentIcon}
        titleColor={colors.text}
        urColor={colors.primary}
        button={{ en: HOME_TEXT.en.open, ur: u.open, icon: '\u{1F511}' }}
        buttonColor={colors.primaryLight}
        onPress={onParentPortal}
        urduOnly={urduOnly}
      />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  centred: { textAlign: 'center' },
  toggle: { alignSelf: 'flex-end' },
  flip: { flexDirection: 'row-reverse' },
  brand: { alignItems: 'center', gap: spacing.sm },
  brandIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { fontSize: 22, color: colors.primary },
  tagline: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.input, backgroundColor: colors.field },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.input, ...shadows.raised },
  childCard: { backgroundColor: colors.childCard },
  parentCard: { backgroundColor: colors.parentCard },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  childIcon: { backgroundColor: colors.clayLight },
  parentIcon: { backgroundColor: colors.card, borderRadius: radius.input },
  cardIconText: { fontSize: 22 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touch.field,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  onButton: { color: colors.onPrimary },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
