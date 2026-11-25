import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, textStyle } from '../../theme';
import { PIN } from '../../utils/constants';
import { useScreenLanguage } from '../../context/LanguageContext';
import PinKeypad from './PinKeypad';
import { PIN_TEXT } from './pinText';
import { initialLockState, isLocked, lockRemainingMs, registerFailure, registerSuccess, remainingAttempts } from './pinLock';

/**
 * Parent gate (UC-22, UC-23, BR-34). The first visit creates a PIN (enter + confirm);
 * later visits verify it. 5 wrong PINs in a row lock entry for a while, even after an app restart.
 * store: { hasPin, savePin, checkPin, loadLockState, saveLockState } (all async).
 */
export default function PinScreen({ store, onUnlocked, onBack, onForgotPin, now = Date.now, language }) {
  const lang = useScreenLanguage(language);
  const urdu = lang === 'ur';
  const [mode, setMode] = useState(null); // 'create' | 'confirm' | 'verify', null while loading
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState(null);
  const [lock, setLock] = useState(initialLockState);
  const [clock, setClock] = useState(0);
  const firstPin = useRef('');
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([store.hasPin(), store.loadLockState()]).then(([exists, saved]) => {
      if (!active) return;
      setLock(saved || initialLockState);
      setMode(exists ? 'verify' : 'create');
      setClock(now());
    });
    return () => { active = false; };
  }, [store, now]);

  const locked = mode === 'verify' && isLocked(lock, clock);
  useEffect(() => {
    if (!locked) return undefined;
    const tick = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(tick);
  }, [locked, now]);

  const submit = async (pin) => {
    busy.current = true;
    try {
      if (mode === 'create') {
        firstPin.current = pin;
        setMessage(null);
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (pin !== firstPin.current) {
          setMessage({ key: 'mismatch' });
          setMode('create');
          return;
        }
        await store.savePin(pin);
        await store.saveLockState(registerSuccess());
        onUnlocked?.();
      } else if (await store.checkPin(pin)) {
        const next = registerSuccess();
        await store.saveLockState(next);
        setLock(next);
        onUnlocked?.();
      } else {
        const at = now();
        const next = registerFailure(lock, at);
        await store.saveLockState(next);
        setLock(next);
        setClock(at);
        setMessage(isLocked(next, at) ? null : { key: 'wrong', n: remainingAttempts(next) });
      }
    } finally {
      setEntry('');
      busy.current = false;
    }
  };

  const pressDigit = (digit) => {
    if (busy.current || locked || entry.length >= PIN.LENGTH) return;
    const next = entry + digit;
    setEntry(next);
    if (next.length === PIN.LENGTH) submit(next);
  };

  if (!mode) return <SafeAreaView style={styles.screen} />;

  // Messages are stored as keys so they re-render in the current language.
  const line = (m, l) => (typeof PIN_TEXT[l][m.key] === 'function' ? PIN_TEXT[l][m.key](m.n) : PIN_TEXT[l][m.key]);
  const shown = locked ? { key: 'locked', n: Math.ceil(lockRemainingMs(lock, clock) / 60000) } : message;
  const t = PIN_TEXT[lang];

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.topRow, urdu && styles.flip]}>
        {onBack && <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t.back} style={styles.backPill}>
          {urdu
            ? <><Text style={[textStyle('label', 'ur'), styles.primaryText]}>{t.back}</Text><Text style={[textStyle('label'), styles.primaryText]}> →</Text></>
            : <Text style={[textStyle('label'), styles.primaryText]}>← {t.back}</Text>}
        </Pressable>}
        <View style={styles.shield}><Text style={styles.shieldIcon}>{'\u{1F6E1}︎'}</Text></View>
      </View>

      <View style={styles.header}>
        <Text accessibilityRole="header" style={[textStyle('headlineMd', lang), styles.title]}>{t[mode]}</Text>
        <Text style={[textStyle('body', lang), styles.subtitle]}>{t.subtitle}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.dots} accessible accessibilityLabel={t.digitsEntered(entry.length, PIN.LENGTH)}>
          {Array.from({ length: PIN.LENGTH }, (_, i) => <View key={i} testID="pin-dot" style={[styles.dot, i < entry.length && styles.dotFilled]} />)}
        </View>
        {shown && <View style={styles.banner} accessibilityLiveRegion="polite">
          <Text style={[textStyle('body', lang), styles.bannerText]}>⚠ {line(shown, lang)}</Text>
        </View>}
      </View>

      <PinKeypad onDigit={pressDigit} onDelete={() => setEntry((e) => e.slice(0, -1))} disabled={locked} language={lang} />

      {mode === 'verify' && onForgotPin && <Pressable onPress={onForgotPin} accessibilityRole="link" style={styles.forgot}>
        <Text style={[textStyle('body', lang), styles.link, styles.centred]}>{t.forgot}</Text>
      </Pressable>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  flip: { flexDirection: 'row-reverse' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface },
  shield: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  shieldIcon: { fontSize: 20, color: colors.primary },
  header: { alignItems: 'center', gap: spacing.xs },
  title: { color: colors.text, textAlign: 'center' },
  centred: { textAlign: 'center' },
  subtitle: { color: colors.textMuted, textAlign: 'center' },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.card },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface },
  dotFilled: { backgroundColor: colors.primary },
  banner: { padding: spacing.md, borderRadius: radius.input, backgroundColor: colors.errorLight },
  bannerText: { color: colors.error },
  forgot: { alignItems: 'center', gap: spacing.xs },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  primaryText: { color: colors.primary },
});
