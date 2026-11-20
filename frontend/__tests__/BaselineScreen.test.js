import React, { useEffect } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import BaselineScreen from '../src/modules/m01_onboarding/BaselineScreen';
import { loadInProgress, loadLastCompleted, saveBaseline } from '../src/modules/m01_onboarding/baselineStore';

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

const CHECKLIST = {
  version: 't1',
  tasks: [
    { id: 'apple', icon: 'A', word: { en: 'apple', ur: 'سیب' } },
    { id: 'ball', icon: 'B', word: { en: 'ball', ur: 'گیند' } },
  ],
};
const NOW = Date.parse('2026-11-16T10:00:00Z');
const now = () => NOW;

function SetChild({ language = 'en' }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild({ _id: 'kid', name: 'Ali', language }), [language, setChild]);
  return null;
}

async function render(props = {}, language) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider><SetChild language={language} /><BaselineScreen checklist={CHECKLIST} now={now} {...props} /></ChildProfileProvider>,
    );
  });
  const root = tree.root;
  const press = (testID) => ReactTestRenderer.act(async () => root.findByProps({ testID }).props.onPress());
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).flat().join(''));
  return { root, press, texts };
}

beforeEach(() => AsyncStorage.clear());

describe('BaselineScreen (FR-2)', () => {
  test('starts at task 1, attempt 1, 0%, showing the answer in both languages', async () => {
    const { texts } = await render();
    expect(texts()).toEqual(expect.arrayContaining(['Task 1 of 2', 'Attempt 1 of 3', '0%', 'Ask child to name the object']));
    expect(texts().some((t) => t.startsWith('Answer: apple'))).toBe(true);
    expect(texts()).toContain('سیب');
  });

  test('shows the child-language word first for an Urdu child', async () => {
    const { texts } = await render({}, 'ur');
    expect(texts()).toContain('Answer: سیب');
    expect(texts()).toContain('apple');
  });

  test('saves after every tap, so the check can resume', async () => {
    const { press, texts } = await render();
    await press('try-again');
    expect(texts()).toContain('Attempt 2 of 3');
    await press('said');
    expect(texts()).toEqual(expect.arrayContaining(['Task 2 of 2', '50%']));
    expect((await loadInProgress('kid')).responses).toEqual([{ taskId: 'apple', result: 'said', attempts: 2 }]);
  });

  test('"Save and continue later" saves and exits; reopening resumes the same task', async () => {
    const onExit = jest.fn();
    const first = await render({ onExit });
    await first.press('skip');
    await first.press('save-later');
    expect(onExit).toHaveBeenCalled();
    const again = await render();
    expect(again.texts()).toContain('Task 2 of 2');
  });

  test('finishing calls onComplete with a scored, completed baseline', async () => {
    const onComplete = jest.fn();
    const { press } = await render({ onComplete });
    await press('said');
    await press('skip');
    const result = onComplete.mock.calls[0][0];
    expect(result).toMatchObject({ status: 'complete', baselineScore: 100, checklistVersion: 't1' });
    expect((await loadLastCompleted('kid')).baselineId).toBe(result.baselineId);
    expect(await loadInProgress('kid')).toBeNull();
  });

  test('blocks a new check within 30 days of the last one (BR-6)', async () => {
    await saveBaseline({ childId: 'kid', status: 'complete', completedAt: new Date(NOW - 5 * 86400000).toISOString() });
    const { texts, root } = await render();
    expect(texts().some((t) => t.startsWith('A baseline check was completed recently.'))).toBe(true);
    expect(root.findAllByProps({ testID: 'said' })).toHaveLength(0);
  });
});
