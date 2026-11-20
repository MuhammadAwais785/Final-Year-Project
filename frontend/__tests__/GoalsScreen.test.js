import React, { useEffect } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import GoalsScreen from '../src/modules/m01_onboarding/GoalsScreen';
import { getGoals, saveGoals } from '../src/modules/m01_onboarding/goalsStore';
import { saveBaseline } from '../src/modules/m01_onboarding/baselineStore';

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

function SetChild() {
  const { setChild } = useChildProfile();
  useEffect(() => setChild({ _id: 'kid', name: 'Ali', age: 5, language: 'en' }), [setChild]);
  return null;
}

let tree;
async function render(props = {}) {
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<ChildProfileProvider><SetChild /><GoalsScreen {...props} /></ChildProfileProvider>);
  });
  const root = tree.root;
  const find = (testID) => root.findAllByProps({ testID }).filter((n) => typeof n.type === 'string' || n.props.onPress || n.props.onChangeText)[0];
  const press = (testID) => ReactTestRenderer.act(async () => root.findByProps({ testID }).props.onPress());
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).flat().join(''));
  const count = () => root.findAll((n) => typeof n.props.testID === 'string' && /^goal-\d+$/.test(n.props.testID) && typeof n.type === 'string').length;
  return { root, find, press, texts, count };
}

const baseline = { baselineId: 'b', childId: 'kid', status: 'complete', completedAt: '2026-11-01T00:00:00Z',
  responses: ['apple', 'ball', 'cat'].map((taskId) => ({ taskId, result: 'inconclusive', attempts: 3 })) };

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });
afterEach(async () => { if (tree) await ReactTestRenderer.act(async () => tree.unmount()); tree = null; });

describe('GoalsScreen (FR-3, BR-7)', () => {
  test('prefills from the baseline suggestions', async () => {
    await saveBaseline(baseline);
    const s = await render();
    expect(s.count()).toBe(3);
    expect(s.texts()).toContain('Weekly word target');
    expect(s.find('target-0').props.value).toBe('5');
  });

  test('loads saved goals instead of suggestions', async () => {
    await saveGoals('kid', [{ id: 'g', type: 'daily_minutes', target: 20 }]);
    const s = await render();
    expect(s.count()).toBe(1);
    expect(s.find('target-0').props.value).toBe('20');
  });

  test('adds and removes goals, respecting the maximum', async () => {
    const s = await render();
    expect(s.count()).toBe(3);
    await s.press('add-skill');
    await s.press('add-skill');
    expect(s.count()).toBe(5);
    expect(s.root.findAllByProps({ testID: 'add-skill' })).toHaveLength(0);
    expect(s.texts().join(' ')).toContain('limit of 5');
    await s.press('remove-4');
    expect(s.count()).toBe(4);
    expect(s.root.findAllByProps({ testID: 'add-skill' }).length).toBeGreaterThan(0);
  });

  test('shows validation errors inline and does not save', async () => {
    const s = await render();
    await ReactTestRenderer.act(async () => s.find('target-0').props.onChangeText('999'));
    await s.press('save-goals');
    expect(s.texts().join(' ')).toContain('Enter 1 to 50 words.');
    expect(await getGoals('kid')).toBeNull();
  });

  test('saves valid edits and calls onSaved once on a double tap', async () => {
    const onSaved = jest.fn();
    const s = await render({ onSaved });
    await ReactTestRenderer.act(async () => s.find('target-0').props.onChangeText('12'));
    const button = s.root.findByProps({ testID: 'save-goals' });
    await ReactTestRenderer.act(async () => { button.props.onPress(); button.props.onPress(); });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect((await getGoals('kid'))[0].target).toBe(12);
  });

  test('does not update state after unmount', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const s = await render();
    let pending;
    await ReactTestRenderer.act(async () => {
      pending = s.root.findByProps({ testID: 'save-goals' }).props.onPress();
      tree.unmount();
    });
    await ReactTestRenderer.act(async () => { await pending; });
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
    tree = null;
  });

  test('renders Urdu text in its own right-to-left Text', async () => {
    const s = await render({ language: 'ur' });
    expect(s.texts()).toContain('اہداف');
    const title = s.root.findAllByType(Text).find((t) => t.props.children === 'ہفتہ وار الفاظ کا ہدف');
    expect(title.props.style.flat ? title.props.style.flat() : title.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ writingDirection: 'rtl' })]));
    expect(s.texts().some((x) => /[a-z]/i.test(x) && /[؀-ۿ]/.test(x))).toBe(false);
  });

  test('text field input: letters and empty become an error, minus signs are dropped', async () => {
    const s = await render();
    await ReactTestRenderer.act(async () => s.find('target-0').props.onChangeText('abc'));
    expect(s.find('target-0').props.value).toBe('');
    await s.press('save-goals');
    expect(s.texts().join(' ')).toContain('Enter 1 to 50 words.');
    await ReactTestRenderer.act(async () => s.find('target-0').props.onChangeText('-7'));
    expect(s.find('target-0').props.value).toBe('7');
    await ReactTestRenderer.act(async () => s.find('target-1').props.onChangeText('0'));
    await s.press('save-goals');
    expect(s.texts().join(' ')).toContain('Enter 5 to 30 minutes.');
    expect(await getGoals('kid')).toBeNull();
  });

  test('a failed save shows a message and lets the parent try again', async () => {
    const onSaved = jest.fn();
    const s = await render({ onSaved });
    AsyncStorage.setItem.mockImplementationOnce(async () => { throw new Error('disk full'); });
    await s.press('save-goals');
    expect(onSaved).not.toHaveBeenCalled();
    expect(s.texts()).toContain('Could not save. Please try again.');
    expect(s.root.findByProps({ testID: 'save-goals' }).props.disabled).toBe(false);
    await s.press('save-goals');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
