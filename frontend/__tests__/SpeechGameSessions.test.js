import React, { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HoldToExitButton from '../src/components/HoldToExitButton';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import ColourMatchingScreen from '../src/modules/m03_games/ColourMatchingScreen';
import { createMockRecognizer } from '../src/modules/m03_games/mockRecognizer';
import ObjectNamingScreen from '../src/modules/m03_games/ObjectNamingScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

const { act } = ReactTestRenderer;

function WithChild({ child, children }) {
  const { child: current, setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return current ? children : null;
}

let tree;
let clock;
let rewards;
async function render(script, { Screen = ObjectNamingScreen, sessions, onExit, ids = ['cat', 'dog'] } = {}) {
  const recognizer = createMockRecognizer({ script });
  rewards = { addStars: jest.fn(async () => ({ milestoneJustReached: false })) };
  await act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <WithChild child={{ _id: 'kid-1', name: 'Ali', language: 'en' }}>
          <Screen recognizer={recognizer} itemIds={ids} roundSize={2} rewards={rewards} sessions={sessions} onExit={onExit} now={() => (clock += 100)} />
        </WithChild>
      </ChildProfileProvider>,
    );
  });
}
const root = () => tree.root;
const has = (testID) => root().findAllByProps({ testID }).length > 0;
const press = async (testID) => act(async () => root().findByProps({ testID }).props.onPress());
const wait = async (ms = 1500) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });
const exitNow = async () => act(async () => root().findByType(HoldToExitButton).props.onExit());
const finishRound = async () => {
  for (let i = 0; i < 2; i++) {
    await wait();
    await press('next');
  }
  await wait(100);
};
const fake = () => ({ saveSession: jest.fn(async () => ({})) });

beforeEach(() => {
  clock = 1000;
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('speech game saves sessions (UC-5 POST-1)', () => {
  test('a finished round is saved once with activity, stars and attempts', async () => {
    const sessions = fake();
    await render(['recognized', 'recognized'], { sessions });
    await finishRound();
    await wait(3000);
    expect(sessions.saveSession).toHaveBeenCalledTimes(1);
    const [childId, saved] = sessions.saveSession.mock.calls[0];
    expect(childId).toBe('kid-1');
    expect(saved).toMatchObject({ activity: 'object_naming', partial: false });
    expect(saved.startedAt).toBeLessThan(saved.endedAt);
    expect(saved.round.attemptLog).toHaveLength(2);
    expect(saved.round.results.reduce((n, r) => n + r.stars, 0)).toBe(4);
  });

  test('Play again saves the next round as a new session with a new startedAt', async () => {
    const sessions = fake();
    await render(Array(4).fill('recognized'), { sessions });
    await finishRound();
    await press('play-again');
    await finishRound();
    await wait(3000);
    expect(sessions.saveSession).toHaveBeenCalledTimes(2);
    const [a, b] = sessions.saveSession.mock.calls.map((c) => c[1]);
    expect(b.startedAt).toBeGreaterThan(a.startedAt);
    expect(b.startedAt).toBeGreaterThanOrEqual(a.endedAt);
    expect(b.round).not.toBe(a.round);
  });

  test('exit mid-round saves a partial session', async () => {
    const sessions = fake();
    const onExit = jest.fn();
    await render(['recognized'], { sessions, onExit });
    await wait();
    await exitNow();
    expect(sessions.saveSession).toHaveBeenCalledTimes(1);
    expect(sessions.saveSession.mock.calls[0][1]).toMatchObject({ activity: 'object_naming', partial: true });
    expect(sessions.saveSession.mock.calls[0][1].round.attemptLog).toHaveLength(1);
    expect(onExit).toHaveBeenCalled();
  });

  test('exit with no attempts saves nothing', async () => {
    const sessions = fake();
    const onExit = jest.fn();
    await render([], { sessions, onExit });
    await exitNow();
    expect(sessions.saveSession).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });

  test('exit after finishing does not save twice', async () => {
    const sessions = fake();
    await render(['recognized', 'recognized'], { sessions });
    await finishRound();
    await exitNow();
    await wait(3000);
    expect(sessions.saveSession).toHaveBeenCalledTimes(1);
  });

  test('a failing store does not crash the screen', async () => {
    const sessions = { saveSession: jest.fn(async () => { throw new Error('disk full'); }) };
    const onExit = jest.fn();
    await render(['recognized', 'recognized'], { sessions, onExit });
    await finishRound();
    await wait(3000);
    expect(has('play-again')).toBe(true);
    await exitNow();
    expect(onExit).toHaveBeenCalled();
  });

  test('colour matching saves with its own activity id', async () => {
    const sessions = fake();
    await render(['recognized', 'recognized'], { Screen: ColourMatchingScreen, sessions, ids: ['red', 'blue'] });
    await finishRound();
    expect(sessions.saveSession.mock.calls[0][1].activity).toBe('colour_matching');
  });

  test('exit on the last correct screen before Next saves the session and its stars once (stores agree)', async () => {
    const sessions = fake();
    const onExit = jest.fn();
    await render(['recognized', 'recognized'], { sessions, onExit });
    await wait();
    await press('next');
    await wait(); // last prompt answered: correct screen, Next not pressed
    expect(has('next')).toBe(true);
    await exitNow();
    await exitNow(); // double hold
    await wait(3000);
    expect(sessions.saveSession).toHaveBeenCalledTimes(1);
    expect(sessions.saveSession.mock.calls[0][1].partial).toBe(false);
    expect(rewards.addStars).toHaveBeenCalledTimes(1);
    expect(rewards.addStars.mock.calls[0][1]).toBe(4);
  });

  test('a round with no prompts saves no empty session', async () => {
    const sessions = fake();
    await render([], { sessions, ids: [] });
    await wait(3000);
    expect(sessions.saveSession).not.toHaveBeenCalled();
  });

  test('leaving without the exit button (screen removed) still saves the partial round once', async () => {
    const sessions = fake();
    await render(['recognized'], { sessions });
    await wait();
    await act(async () => tree.unmount());
    tree = null;
    expect(sessions.saveSession).toHaveBeenCalledTimes(1);
    expect(sessions.saveSession.mock.calls[0][1].partial).toBe(true);
  });
});
