import React, { useEffect } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import { LANGUAGE_KEY, LanguageProvider, useLanguage, useScreenLanguage } from '../src/context/LanguageContext';
import BaselineScreen from '../src/modules/m01_onboarding/BaselineScreen';
import { BASELINE_TEXT, formatDate, URDU_MONTHS } from '../src/modules/m01_onboarding/baselineText';
import { saveBaseline } from '../src/modules/m01_onboarding/baselineStore';
import ConsentScreen from '../src/modules/m01_onboarding/ConsentScreen';
import { CONSENT_TEXT } from '../src/modules/m01_onboarding/consentText';
import PinScreen from '../src/modules/m01_onboarding/PinScreen';
import { PIN_TEXT } from '../src/modules/m01_onboarding/pinText';
import { PIN } from '../src/utils/constants';
import { requestMicrophone } from '../src/utils/permissions';

jest.mock('../src/utils/permissions', () => ({ requestMicrophone: jest.fn(), requestCamera: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => {
  let data = {};
  return {
    getItem: jest.fn(async (k) => (k in data ? data[k] : null)),
    setItem: jest.fn(async (k, v) => { data[k] = v; }),
    removeItem: jest.fn(async (k) => { delete data[k]; }),
    clear: async () => { data = {}; },
  };
});
const AsyncStorage = require('@react-native-async-storage/async-storage');

const mounted = [];
afterEach(async () => {
  await ReactTestRenderer.act(async () => mounted.splice(0).forEach((t) => t.unmount()));
});
beforeEach(() => AsyncStorage.clear());

async function mount(element) {
  let tree;
  await ReactTestRenderer.act(async () => { tree = ReactTestRenderer.create(element); });
  mounted.push(tree);
  const root = tree.root;
  return { root, texts: () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join('')) };
}

function SetChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return null;
}
const withChild = (el, child = { _id: 'kid', name: 'Ali', age: 5, language: 'en' }) =>
  <LanguageProvider><ChildProfileProvider><SetChild child={child} />{el}</ChildProfileProvider></LanguageProvider>;

let latest;
function Probe({ prop }) {
  latest = { ...useLanguage(), screen: useScreenLanguage(prop) };
  return null;
}

describe('LanguageContext races and bad input', () => {
  test('a choice made before the saved value loads wins over the saved value', async () => {
    let finishLoad;
    AsyncStorage.getItem.mockImplementationOnce(() => new Promise((resolve) => { finishLoad = resolve; }));
    await mount(<LanguageProvider><Probe /></LanguageProvider>);
    await ReactTestRenderer.act(async () => latest.setLanguage('en'));
    await ReactTestRenderer.act(async () => finishLoad('ur'));
    expect(latest.language).toBe('en');
  });

  test('an unmount before the saved value loads does not crash or warn', async () => {
    let finishLoad;
    AsyncStorage.getItem.mockImplementationOnce(() => new Promise((resolve) => { finishLoad = resolve; }));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { root } = await mount(<LanguageProvider><Probe /></LanguageProvider>);
    expect(root).toBeTruthy();
    await ReactTestRenderer.act(async () => mounted.splice(0).forEach((t) => t.unmount()));
    await ReactTestRenderer.act(async () => finishLoad('ur'));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('a save failure keeps the choice for this session', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await mount(<LanguageProvider><Probe /></LanguageProvider>);
    await ReactTestRenderer.act(async () => latest.setLanguage('ur'));
    expect(latest.language).toBe('ur');
  });

  test.each([['fr'], [''], [null], [42], ['UR']])('an invalid screen prop %p falls back to the shared setting', async (bad) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'ur');
    await mount(<LanguageProvider><Probe prop={bad} /></LanguageProvider>);
    expect(latest.screen).toBe('ur');
  });

  test('a non-string saved value is ignored', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(undefined);
    await mount(<LanguageProvider><Probe /></LanguageProvider>);
    expect(latest.language).toBe('en');
  });
});

describe('Urdu dates', () => {
  test('every month has an Urdu name and the format is day month year', () => {
    expect(URDU_MONTHS).toHaveLength(12);
    expect(formatDate(new Date(2027, 0, 1), 'ur')).toBe('1 جنوری 2027');
    expect(formatDate(new Date(2026, 11, 31), 'ur')).toBe('31 دسمبر 2026');
  });
});

describe('Urdu messages on the edge paths', () => {
  const NOW = Date.parse('2026-11-20T10:00:00Z');

  test('baseline blocked within 30 days shows the Urdu sentence with an Urdu date', async () => {
    const completedAt = new Date(NOW - 5 * 86400000).toISOString();
    await saveBaseline({ childId: 'kid', status: 'complete', completedAt });
    const { root, texts } = await mount(withChild(<BaselineScreen language="ur" now={() => NOW} />));
    const next = formatDate(new Date(Date.parse(completedAt) + 30 * 86400000), 'ur');
    expect(texts()).toContain(BASELINE_TEXT.ur.blocked(next));
    expect(root.findAllByProps({ testID: 'said' })).toHaveLength(0);
  });

  test('PIN lockout message is in Urdu and the keypad is disabled', async () => {
    const store = {
      hasPin: async () => true,
      savePin: async () => {},
      checkPin: async () => false,
      loadLockState: async () => ({ failedAttempts: PIN.MAX_ATTEMPTS, lockedUntil: NOW + 2 * 60000 }),
      saveLockState: async () => {},
    };
    const { root, texts } = await mount(<PinScreen store={store} language="ur" now={() => NOW} />);
    expect(texts().some((t) => t.includes(PIN_TEXT.ur.locked(2)))).toBe(true);
    expect(texts().some((t) => t.includes('Too many'))).toBe(false);
    expect(root.findByProps({ testID: 'pin-key-1' }).props.disabled).toBe(true);
  });

  test('consent: a blocked microphone shows the Urdu message and the Urdu Settings button', async () => {
    requestMicrophone.mockResolvedValue('blocked');
    const { root, texts } = await mount(withChild(<ConsentScreen language="ur" />));
    const save = root.findAll((n) => n.props.accessibilityLabel === CONSENT_TEXT.ur.save && n.props.onPress)[0];
    await ReactTestRenderer.act(async () => save.props.onPress());
    expect(texts()).toContain(CONSENT_TEXT.ur.messages.micBlocked);
    expect(texts()).toContain(CONSENT_TEXT.ur.openSettings);
    expect(root.findByProps({ testID: 'open-settings' })).toBeTruthy();
  });
});
