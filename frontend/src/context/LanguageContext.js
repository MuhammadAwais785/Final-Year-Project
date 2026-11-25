import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES } from '../utils/constants';

export const LANGUAGE_KEY = '@silent_screen/parent_language';
const SUPPORTED = Object.values(LANGUAGES);
const isSupported = (value) => SUPPORTED.includes(value);

// Used outside a provider so screens and tests that never set a language keep working in English.
const FALLBACK = { language: LANGUAGES.ENGLISH, setLanguage: () => {} };
const LanguageContext = createContext(FALLBACK);

/**
 * The parent's app language (UI-8, BR-3), saved on the phone and restored on the next launch.
 * It is separate from the child's game language, which stays on the child profile.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(LANGUAGES.ENGLISH);
  const chosen = useRef(false); // a choice made before the saved value loads must win

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => AsyncStorage.getItem(LANGUAGE_KEY))
      .then((saved) => { if (active && !chosen.current && isSupported(saved)) setLanguageState(saved); })
      .catch(() => {}); // unreadable storage: stay on English
    return () => { active = false; };
  }, []);

  const setLanguage = useCallback((value) => {
    if (!isSupported(value)) return;
    chosen.current = true;
    setLanguageState(value);
    Promise.resolve().then(() => AsyncStorage.setItem(LANGUAGE_KEY, value)).catch(() => {}); // the choice still applies this session
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** { language, setLanguage } for the parent's app language. */
export const useLanguage = () => useContext(LanguageContext);

/** A screen's language: its `language` prop when given, otherwise the shared setting. */
export function useScreenLanguage(language) {
  const shared = useLanguage().language;
  return isSupported(language) ? language : shared;
}
