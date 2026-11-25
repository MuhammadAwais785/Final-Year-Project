import React, { useEffect } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ToggleSwitch from '../src/components/ToggleSwitch';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import BaselineScreen from '../src/modules/m01_onboarding/BaselineScreen';
import { BASELINE_TEXT, formatDate } from '../src/modules/m01_onboarding/baselineText';
import ChildProfileScreen from '../src/modules/m01_onboarding/ChildProfileScreen';
import { CHILD_PROFILE_TEXT } from '../src/modules/m01_onboarding/childProfileText';
import ConsentScreen from '../src/modules/m01_onboarding/ConsentScreen';
import { CONSENT_TEXT } from '../src/modules/m01_onboarding/consentText';
import { HOME_TEXT } from '../src/modules/m01_onboarding/homeText';
import HomeScreen from '../src/modules/m01_onboarding/HomeScreen';
import { PIN_TEXT } from '../src/modules/m01_onboarding/pinText';
import PinScreen from '../src/modules/m01_onboarding/PinScreen';
import { validateChildProfile } from '../src/modules/m01_onboarding/validateChildProfile';

jest.mock('../src/api/profiles', () => ({ createProfile: jest.fn() }));
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

function SetChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return null;
}

async function render(element, child = { _id: 'kid', name: 'Ali', age: 5, language: 'en' }) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<LanguageProvider><ChildProfileProvider><SetChild child={child} />{element}</ChildProfileProvider></LanguageProvider>);
  });
  mounted.push(tree);
  const root = tree.root;
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  const urduTexts = () => root.findAllByType(Text).filter((t) => [].concat(t.props.style).flat().some((s) => s && s.writingDirection === 'rtl'));
  return { root, texts, urduTexts };
}

// An Urdu Text must hold Urdu only, and an English Text no Urdu (never nested).
const ARABIC = /[؀-ۿ]/;
const expectSeparateScripts = (root) => {
  root.findAllByType(Text).forEach((t) => {
    const text = [].concat(t.props.children).filter((c) => typeof c === 'string').join('');
    const rtl = [].concat(t.props.style).flat().some((s) => s && s.writingDirection === 'rtl');
    const latin = text.replace(/[^A-Za-z]/g, '');
    if (rtl) expect(latin).toBe(''); // digits and punctuation may sit inside Urdu text
    else expect(ARABIC.test(text)).toBe(false);
  });
};

const fakeStore = () => ({
  hasPin: async () => true,
  savePin: async () => {},
  checkPin: async (p) => p === '1234',
  loadLockState: async () => null,
  saveLockState: async () => {},
});

describe('Home in Urdu', () => {
  test('shows Urdu only, in Urdu Texts, with the toggle on Urdu', async () => {
    const { root, texts, urduTexts } = await render(<HomeScreen language="ur" />);
    [HOME_TEXT.ur.childMode, HOME_TEXT.ur.parentPortal, HOME_TEXT.ur.start, HOME_TEXT.ur.open].forEach((t) => expect(texts()).toContain(t));
    expect(texts()).not.toContain('Child Mode');
    expect(urduTexts().length).toBeGreaterThan(3);
    expect(root.findByProps({ testID: 'lang-ur' }).props.accessibilityState).toEqual({ selected: true });
  });

  test('follows the shared setting and the toggle switches it', async () => {
    const { root, texts } = await render(<HomeScreen />);
    expect(texts()).toContain('Child Mode');
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'lang-ur' }).props.onPress());
    expect(texts()).toContain(HOME_TEXT.ur.childMode);
    expect(texts()).not.toContain('Child Mode');
  });

  test('the hint about adding a child is in Urdu', async () => {
    const { texts } = await render(<HomeScreen language="ur" childModeAvailable={false} />);
    expect(texts()).toContain(HOME_TEXT.ur.needChild);
  });

  test('each script is in its own Text', async () => {
    expectSeparateScripts((await render(<HomeScreen language="ur" />)).root);
    expectSeparateScripts((await render(<HomeScreen language="en" />)).root);
  });
});

describe('PIN in Urdu', () => {
  test('shows the Urdu title and subtitle, Western digits, an Urdu Delete label', async () => {
    const { root, texts } = await render(<PinScreen store={fakeStore()} language="ur" onBack={() => {}} onForgotPin={() => {}} />);
    [PIN_TEXT.ur.verify, PIN_TEXT.ur.subtitle, PIN_TEXT.ur.back, PIN_TEXT.ur.forgot, PIN_TEXT.ur.delete].forEach((t) => expect(texts()).toContain(t));
    expect(texts()).not.toContain('Enter Parent PIN');
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((d) => expect(texts()).toContain(d));
    expect(root.findByProps({ testID: 'pin-key-5' })).toBeTruthy();
    expectSeparateScripts(root);
  });

  test('a wrong PIN shows the Urdu message with the attempts left', async () => {
    const { root, texts } = await render(<PinScreen store={fakeStore()} language="ur" />);
    for (const d of '9999') await ReactTestRenderer.act(async () => root.findByProps({ testID: `pin-key-${d}` }).props.onPress());
    expect(texts().some((t) => t.includes(PIN_TEXT.ur.wrong(4)))).toBe(true);
    expectSeparateScripts(root);
  });

  test('the right PIN still unlocks', async () => {
    const onUnlocked = jest.fn();
    const { root } = await render(<PinScreen store={fakeStore()} language="ur" onUnlocked={onUnlocked} />);
    for (const d of '1234') await ReactTestRenderer.act(async () => root.findByProps({ testID: `pin-key-${d}` }).props.onPress());
    expect(onUnlocked).toHaveBeenCalled();
  });

  test('English keeps both languages', async () => {
    const { texts } = await render(<PinScreen store={fakeStore()} language="en" />);
    expect(texts()).toEqual(expect.arrayContaining([PIN_TEXT.en.verify, PIN_TEXT.ur.verify, 'Delete']));
  });
});

describe('Add a child in Urdu', () => {
  test('shows the Urdu header, labels, placeholder and save button', async () => {
    const { root, texts } = await render(<ChildProfileScreen language="ur" />);
    const t = CHILD_PROFILE_TEXT.ur;
    [t.title, t.intro, t.name, t.age, t.language, t.save].forEach((x) => expect(texts()).toContain(x));
    expect(root.findByProps({ testID: 'child-name' }).props.placeholder).toBe(t.namePlaceholder);
    expectSeparateScripts(root);
  });

  test('empty form shows Urdu validation messages', async () => {
    const { root, texts } = await render(<ChildProfileScreen language="ur" />);
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'child-name' }).props.onChangeText(''));
    const save = root.findAll((n) => n.props.accessibilityLabel === CHILD_PROFILE_TEXT.ur.save && n.props.onPress)[0];
    await ReactTestRenderer.act(async () => save.props.onPress());
    const e = CHILD_PROFILE_TEXT.ur.errors;
    [e.nameRequired, e.ageRange, e.languageRequired].forEach((x) => expect(texts()).toContain(x));
    expectSeparateScripts(root);
  });

  test('validateChildProfile returns Urdu messages on request and English by default', () => {
    const urdu = validateChildProfile({ name: '', age: 2, language: 'x' }, 'ur');
    expect(urdu.errors).toEqual({
      name: CHILD_PROFILE_TEXT.ur.errors.nameRequired,
      age: CHILD_PROFILE_TEXT.ur.errors.ageRange,
      language: CHILD_PROFILE_TEXT.ur.errors.languageRequired,
    });
    expect(validateChildProfile({ name: '', age: 2, language: 'x' }).errors.name).toBe("Please enter the child's name.");
  });
});

describe('Consent in Urdu', () => {
  test('shows the Urdu title, heading, rows and save button', async () => {
    const { root, texts } = await render(<ConsentScreen language="ur" />);
    const t = CONSENT_TEXT.ur;
    [t.title, t.heading, t.intro, t.microphone, t.required, t.camera, t.optional, t.privacyTitle, t.save].forEach((x) => expect(texts()).toContain(x));
    expect(texts()).not.toContain('Microphone');
    expectSeparateScripts(root);
  });

  test('the microphone-off message is in Urdu', async () => {
    const { root, texts } = await render(<ConsentScreen language="ur" />);
    await ReactTestRenderer.act(async () => root.findAllByType(ToggleSwitch).find((n) => n.props.testID === 'consent-microphone').props.onValueChange(false));
    const save = root.findAll((n) => n.props.accessibilityLabel === CONSENT_TEXT.ur.save && n.props.onPress)[0];
    await ReactTestRenderer.act(async () => save.props.onPress());
    expect(texts()).toContain(CONSENT_TEXT.ur.messages.micOff);
  });
});

describe('Baseline in Urdu', () => {
  const CHECKLIST = { version: 't', tasks: [{ id: 'apple', icon: 'A', word: { en: 'apple', ur: 'سیب' } }, { id: 'ball', icon: 'B', word: { en: 'ball', ur: 'گیند' } }] };

  test('shows Urdu progress, prompt, buttons and the answer', async () => {
    const { root, texts } = await render(<BaselineScreen language="ur" checklist={CHECKLIST} />, { _id: 'kid', name: 'Ali', age: 5, language: 'ur' });
    const t = BASELINE_TEXT.ur;
    [t.title, t.task(1, 2), t.attempt(1, 3), t.ask].forEach((x) => expect(texts()).toContain(x));
    // Buttons and the link carry a leading icon.
    [t.said, t.tryAgain, t.skip, t.later].forEach((x) => expect(texts().some((y) => y.endsWith(x))).toBe(true));
    expect(texts()).toContain(`${t.answer}: سیب`);
    expect(texts()).toContain('apple');
    expectSeparateScripts(root);
  });

  test('an English child shows the Urdu answer label with the English word', async () => {
    const { root, texts } = await render(<BaselineScreen language="ur" checklist={CHECKLIST} />);
    expect(texts()).toContain('جواب:');
    expect(texts()).toContain('apple');
    expect(texts()).not.toContain('جواب: سیب');
    expectSeparateScripts(root);
  });

  test('buttons still work', async () => {
    const { root, texts } = await render(<BaselineScreen language="ur" checklist={CHECKLIST} />);
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'said' }).props.onPress());
    expect(texts()).toContain(BASELINE_TEXT.ur.task(2, 2));
  });

  test('dates are written in Urdu months', () => {
    const d = new Date(2026, 10, 16);
    expect(formatDate(d, 'ur')).toBe('16 نومبر 2026');
    expect(formatDate(d, 'en')).toBe(d.toDateString());
  });
});

describe('wording files', () => {
  const same = (a, b, path = '') => {
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
    Object.keys(a).forEach((k) => { if (a[k] && typeof a[k] === 'object') same(a[k], b[k], `${path}${k}.`); });
  };
  test.each([['baseline', BASELINE_TEXT], ['childProfile', CHILD_PROFILE_TEXT], ['consent', CONSENT_TEXT], ['home', HOME_TEXT], ['pin', PIN_TEXT]])(
    '%s has the same keys in English and Urdu', (_n, text) => same(text.en, text.ur),
  );
});

describe('shared setting reaches the screens', () => {
  test('a language chosen in the provider is used by a screen with no language prop', async () => {
    await AsyncStorage.setItem('@silent_screen/parent_language', 'ur');
    function Probe() { return <Text>{useLanguage().language}</Text>; }
    const { texts } = await render(<><Probe /><ChildProfileScreen /></>);
    expect(texts()).toContain(CHILD_PROFILE_TEXT.ur.title);
  });
});
