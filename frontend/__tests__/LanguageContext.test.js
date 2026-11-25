import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LANGUAGE_KEY, LanguageProvider, useLanguage, useScreenLanguage } from '../src/context/LanguageContext';

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

let latest;
function Probe({ prop }) {
  latest = { ...useLanguage(), screen: useScreenLanguage(prop) };
  return null;
}

async function mount(withProvider = true, prop) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(withProvider ? <LanguageProvider><Probe prop={prop} /></LanguageProvider> : <Probe prop={prop} />);
  });
  mounted.push(tree);
  return tree;
}

describe('LanguageContext (UI-8, BR-3)', () => {
  test('defaults to English', async () => {
    await mount();
    expect(latest.language).toBe('en');
  });

  test('setLanguage changes the language and saves it', async () => {
    await mount();
    await ReactTestRenderer.act(async () => latest.setLanguage('ur'));
    expect(latest.language).toBe('ur');
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('ur');
  });

  test('a saved choice is restored on the next launch', async () => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'ur');
    await mount();
    expect(latest.language).toBe('ur');
  });

  test('a corrupt or unknown saved value is ignored', async () => {
    for (const bad of ['fr', '', '{"x":1}', 'UR']) {
      await AsyncStorage.setItem(LANGUAGE_KEY, bad);
      await mount();
      expect(latest.language).toBe('en');
    }
  });

  test('an unknown language is not accepted or saved', async () => {
    await mount();
    await ReactTestRenderer.act(async () => latest.setLanguage('fr'));
    expect(latest.language).toBe('en');
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBeNull();
  });

  test('unreadable storage leaves English and does not crash', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('disk'));
    await mount();
    expect(latest.language).toBe('en');
  });

  test('works without a provider: English, and setLanguage does nothing', async () => {
    await mount(false);
    expect(latest.language).toBe('en');
    expect(() => latest.setLanguage('ur')).not.toThrow();
    expect(latest.language).toBe('en');
  });

  test('a screen language prop wins over the shared setting', async () => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'ur');
    await mount(true, 'en');
    expect(latest.screen).toBe('en');
    await mount(true, undefined);
    expect(latest.screen).toBe('ur');
  });
});
