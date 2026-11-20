import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';

const LANGS = [{ value: 'en', label: 'EN' }, { value: 'ur', label: 'اردو' }];

/** English line above its Urdu line, as everywhere on this screen. */
function Bilingual({ en, ur, variant, enColor, urColor = enColor, centred }) {
  const align = centred ? styles.centred : null;
  return <View>
    <Text style={[textStyle(variant), { color: enColor }, align]}>{en}</Text>
    <Text style={[textStyle(variant, 'ur'), { color: urColor }, align]}>{ur}</Text>
  </View>;
}

function ModeCard({ testID, title, icon, iconStyle, cardStyle, titleColor, urColor, button, buttonColor, onPress, disabled }) {
  return <View style={[styles.card, cardStyle]}>
    <View style={styles.cardTop}>
      <Bilingual en={title.en} ur={title.ur} variant="headlineSm" enColor={titleColor} urColor={urColor} />
      <View style={[styles.cardIcon, iconStyle]}><Text style={styles.cardIconText}>{icon}</Text></View>
    </View>
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title.en}: ${button.en}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.cardButton, { backgroundColor: buttonColor }, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[textStyle('labelLg'), styles.onButton]}>{button.icon}  {button.en}</Text>
      <Text style={[textStyle('bodyLg', 'ur'), styles.onButton]}>{button.ur}</Text>
    </Pressable>
  </View>;
}

/**
 * Home (UI-1, design: app_home_mode_selection): two clearly separated entry points,
 * Child Mode and the PIN-protected Parent Portal. Child Mode needs a child profile first.
 */
export default function HomeScreen({ onChildMode, onParentPortal, childModeAvailable = true, language = 'en', onLanguageChange }) {
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.toggle} accessibilityRole="radiogroup" accessibilityLabel="Language">
        {LANGS.map((l) => {
          const selected = l.value === language;
          return <Pressable
            key={l.value}
            testID={`lang-${l.value}`}
            onPress={() => onLanguageChange?.(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.toggleOption, selected && styles.toggleSelected]}>
            <Text style={[textStyle('labelSm', l.value), selected ? styles.onButton : styles.toggleText]}>{l.label}</Text>
          </Pressable>;
        })}
      </View>

      <View style={styles.brand}>
        <View style={styles.brandIcon}><Text style={styles.brandIconText}>{'\u{1F5E3}︎'}</Text></View>
        <Bilingual en="Silent Screen" ur="سائلنٹ اسکرین سنڈروم" variant="headlineMd" enColor={colors.text} urColor={colors.primary} centred />
        <View style={styles.tagline}>
          <Bilingual en="Talk, play and learn" ur="بولیں، کھیلیں اور سیکھیں" variant="label" enColor={colors.textMuted} urColor={colors.success} centred />
        </View>
      </View>

      <ModeCard
        testID="child-mode"
        title={{ en: 'Child Mode', ur: 'بچوں کا موڈ' }}
        icon={'\u{1F388}'}
        cardStyle={styles.childCard}
        iconStyle={styles.childIcon}
        titleColor={colors.onChildCard}
        urColor={colors.clayDark}
        button={{ en: 'Start', ur: 'شروع کریں', icon: '▶' }}
        buttonColor={colors.clayDark}
        onPress={onChildMode}
        disabled={!childModeAvailable}
      />
      {!childModeAvailable && <Bilingual
        en="Add a child in the Parent Portal first."
        ur="پہلے والدین کے پورٹل میں بچہ شامل کریں۔"
        variant="label"
        enColor={colors.textMuted}
        centred
      />}

      <ModeCard
        testID="parent-portal"
        title={{ en: 'Parent Portal', ur: 'والدین کا پورٹل' }}
        icon={'\u{1F512}'}
        cardStyle={styles.parentCard}
        iconStyle={styles.parentIcon}
        titleColor={colors.text}
        urColor={colors.primary}
        button={{ en: 'Open', ur: 'کھولیں', icon: '\u{1F511}' }}
        buttonColor={colors.primaryLight}
        onPress={onParentPortal}
      />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  centred: { textAlign: 'center' },
  toggle: { alignSelf: 'flex-end', flexDirection: 'row', padding: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.toggle },
  toggleOption: { minWidth: touch.parent, minHeight: 32, paddingHorizontal: spacing.sm, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  toggleSelected: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted },
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
