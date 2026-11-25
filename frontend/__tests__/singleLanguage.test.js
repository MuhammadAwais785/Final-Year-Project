import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import BaselineScreen from '../src/modules/m01_onboarding/BaselineScreen';
import ChildProfileScreen from '../src/modules/m01_onboarding/ChildProfileScreen';
import ConsentScreen from '../src/modules/m01_onboarding/ConsentScreen';
import GoalsScreen from '../src/modules/m01_onboarding/GoalsScreen';
import HomeScreen from '../src/modules/m01_onboarding/HomeScreen';
import PinScreen from '../src/modules/m01_onboarding/PinScreen';
import ChildHomeScreen from '../src/modules/m03_games/ChildHomeScreen';
import { createMockRecognizer } from '../src/modules/m03_games/mockRecognizer';
import ObjectNamingScreen from '../src/modules/m03_games/ObjectNamingScreen';
import CalmingBreakScreen from '../src/modules/m07_intervention/CalmingBreakScreen';

// One language per screen (team decision). Only the language toggle and the child-language chips
// may show both scripts, so the user can recognise their own language.
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

const URDU = /[؀-ۿ]/;
const LATIN_WORD = /[A-Za-z]{2,}/;
let trees = [];

function SetChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return null;
}

// All Text strings on screen, minus the language toggle and the child-language chips.
const EXEMPT_IDS = ['lang-en', 'lang-ur', 'option-en', 'option-ur'];
function screenTexts(root) {
  const exempt = new Set(EXEMPT_IDS.flatMap((id) => root.findAllByProps({ testID: id })).flatMap((n) => n.findAllByType(Text)));
  return root.findAllByType(Text)
    .filter((t) => !exempt.has(t))
    .map((t) => [].concat(t.props.children).flat().filter((c) => typeof c === 'string' || typeof c === 'number').join(''));
}

async function mount(element, child = { _id: 'kid', name: 'Ali', age: 5, language: 'en' }) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<LanguageProvider><ChildProfileProvider><SetChild child={child} />{element}</ChildProfileProvider></LanguageProvider>);
  });
  trees.push(tree);
  return tree;
}

const noUrdu = (root) => screenTexts(root).forEach((s) => expect(s).not.toMatch(URDU));
const noLatin = (root) => screenTexts(root).forEach((s) => expect(s).not.toMatch(LATIN_WORD));

const store = (hasPin = true) => ({
  hasPin: async () => hasPin,
  savePin: async () => {},
  checkPin: async () => false,
  loadLockState: async () => null,
  saveLockState: async () => {},
});
const CHECKLIST = { version: 't', tasks: [{ id: 'apple', icon: 'A', word: { en: 'apple', ur: 'سیب' } }] };

beforeEach(() => {
  AsyncStorage.clear();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(async () => {
  await ReactTestRenderer.act(async () => trees.forEach((t) => t.unmount()));
  trees = [];
  jest.restoreAllMocks();
});

describe('one language per screen: parent screens', () => {
  const screens = {
    Home: (language) => <HomeScreen language={language} childModeAvailable={false} />,
    'Pin (verify, with back and forgot)': (language) => <PinScreen store={store()} language={language} onBack={() => {}} onForgotPin={() => {}} />,
    'Pin (create)': (language) => <PinScreen store={store(false)} language={language} onBack={() => {}} />,
    Consent: (language) => <ConsentScreen language={language} />,
    Goals: (language) => <GoalsScreen language={language} />,
    'Child profile': (language) => <ChildProfileScreen language={language} onBack={() => {}} />,
  };

  Object.entries(screens).forEach(([name, make]) => {
    test(`${name} in English shows no Urdu`, async () => {
      noUrdu((await mount(make('en'))).root);
    });
    test(`${name} in Urdu shows no English words`, async () => {
      noLatin((await mount(make('ur'))).root);
    });
  });

  test('Baseline in English shows no Urdu for an English child', async () => {
    noUrdu((await mount(<BaselineScreen language="en" checklist={CHECKLIST} />)).root);
  });
  test('Baseline in Urdu shows no English words for an Urdu child', async () => {
    noLatin((await mount(<BaselineScreen language="ur" checklist={CHECKLIST} />, { _id: 'kid', name: 'Ali', age: 5, language: 'ur' })).root);
  });
  test('Baseline answer shows the label then only the child-language word, each in its own Text', async () => {
    const en = (await mount(<BaselineScreen language="ur" checklist={CHECKLIST} />)).root;
    expect(screenTexts(en)).toEqual(expect.arrayContaining(['جواب:', 'apple']));
    expect(screenTexts(en)).not.toContain('سیب');
    const ur = (await mount(<BaselineScreen language="en" checklist={CHECKLIST} />, { _id: 'kid', name: 'Ali', age: 5, language: 'ur' })).root;
    expect(screenTexts(ur)).toEqual(expect.arrayContaining(['Answer:', 'سیب']));
    expect(screenTexts(ur)).not.toContain('apple');
  });
});

test('the helper still sees a mixed line in other option chips and pickers', async () => {
  const root = (await mount(<View accessibilityRole="radiogroup"><Text testID="option-5">Age عمر</Text></View>)).root;
  expect(screenTexts(root)).toContain('Age عمر');
});

describe('one language per screen: child screens follow the child language', () => {
  const urdu = { _id: 'kid', name: 'علی', age: 5, language: 'ur' };
  const english = { _id: 'kid', name: 'Ali', age: 5, language: 'en' };

  test('Child home', async () => {
    noUrdu((await mount(<ChildHomeScreen />, english)).root);
    noLatin((await mount(<ChildHomeScreen />, urdu)).root);
  });

  test('Calming break', async () => {
    noUrdu((await mount(<CalmingBreakScreen />, english)).root);
    noLatin((await mount(<CalmingBreakScreen />, urdu)).root);
  });

  test('Object naming game', async () => {
    const game = () => <ObjectNamingScreen recognizer={createMockRecognizer({ script: [] })} itemIds={['apple', 'ball']} roundSize={2} />;
    noUrdu((await mount(game(), english)).root);
    noLatin((await mount(game(), urdu)).root);
  });
});
