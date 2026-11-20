import React, { useEffect } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HoldToExitButton from '../src/components/HoldToExitButton';
import SpeechBubble from '../src/components/SpeechBubble';
import StarCounter from '../src/components/StarCounter';
import Waveform from '../src/components/Waveform';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import { createMockRecognizer } from '../src/modules/m03_games/mockRecognizer';
import ObjectNamingScreen from '../src/modules/m03_games/ObjectNamingScreen';
import MilestoneBadge from '../src/modules/m03_games/MilestoneBadge';
import { objectItem } from '../src/modules/m03_games/objectNamingContent';

// The screen imports the real reward store; the tests pass a fake one, so storage is only stubbed.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

const IDS = ['apple', 'ball']; // 2 words per round keeps the tests short
const { act } = ReactTestRenderer;

// Renders the screen only once the child is in context, so it never starts in the wrong language.
function WithChild({ child, children }) {
  const { child: current, setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return current ? children : null;
}

let tree;
async function render(script, { language = 'en', childId, recognizer, ...props } = {}) {
  const rec = recognizer ?? createMockRecognizer({ script });
  await act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <WithChild child={{ _id: childId, name: 'Ali', language }}>
          <ObjectNamingScreen recognizer={rec} itemIds={IDS} roundSize={2} {...props} />
        </WithChild>
      </ChildProfileProvider>,
    );
  });
  return rec;
}

const root = () => tree.root;
const bubble = () => root().findByType(SpeechBubble).props.text;
const has = (testID) => root().findAllByProps({ testID }).length > 0;
const press = async (testID) => act(async () => root().findByProps({ testID }).props.onPress());
const wait = async (ms = 1500) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });
const shownWord = (language = 'en') => {
  const words = IDS.map((id) => objectItem(id)[language].word);
  return root().findAllByType(Text).map((t) => t.props.children).find((c) => words.includes(c));
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('answers (UC-11)', () => {
  test('starts by listening with the question and an indicator', async () => {
    await render([]);
    expect(bubble()).toBe('What is this?');
    expect(has('listening')).toBe(true);
    expect(root().findByType(HoldToExitButton)).toBeTruthy();
  });

  test('a right answer shows praise and stars, then Next word moves on', async () => {
    await render(['recognized']);
    const first = shownWord();
    await wait();
    expect(bubble()).toBe('Great job!');
    expect(has('correct-tick')).toBe(true);
    expect(root().findByType(StarCounter).props.count).toBe(2);
    expect(root().findAllByType(Text).some((t) => t.props.children === '+2 Stars!')).toBe(true);
    await press('next');
    expect(shownWord()).not.toBe(first);
    expect(bubble()).toBe('What is this?');
    expect(has('listening')).toBe(true);
  });

  test('a wrong answer gets a gentle retry and a mic button', async () => {
    await render(['incorrect']);
    expect(root().findAllByType(Waveform).length).toBe(1); // waveform while listening
    await wait();
    expect(bubble()).toBe("Nice try! Let's try again.");
    expect(has('listen-button')).toBe(true);
    expect(has('listening')).toBe(false);
    expect(root().findAllByType(Waveform).length).toBe(0);
  });

  test('the hint uses the hint tone; the first miss does not', async () => {
    await render(['incorrect', 'incorrect']);
    await wait();
    expect(root().findByType(SpeechBubble).props.tone).toBe('default');
    await press('listen-button');
    await wait();
    expect(root().findByType(SpeechBubble).props.tone).toBe('hint');
  });

  test('an unclear answer never says wrong', async () => {
    await render(['inconclusive']);
    await wait();
    expect(bubble()).toBe("I couldn't hear that well. Let's try once more!");
    expect(bubble().toLowerCase()).not.toMatch(/wrong|incorrect|fail/);
  });

  test('a silent answer is treated like a miss', async () => {
    await render(['no_response']);
    await wait();
    expect(bubble()).toBe("Nice try! Let's try again.");
  });

  test('a hint appears from the Doctor after 2 misses', async () => {
    await render(['incorrect', 'incorrect']);
    const word = shownWord();
    await wait();
    await press('listen-button');
    await wait();
    expect(bubble()).toBe(objectItem(IDS.find((id) => objectItem(id).en.word === word)).en.clue);
  });

  test('moves on kindly after the maximum attempts, with no stars', async () => {
    await render(['incorrect', 'incorrect', 'incorrect', 'incorrect', 'incorrect']);
    for (let i = 0; i < 4; i++) {
      await wait();
      await press('listen-button');
    }
    await wait();
    expect(bubble()).toBe("That's okay! Let's try another one.");
    expect(root().findByType(StarCounter).props.count).toBe(0);
    await press('next');
    expect(bubble()).toBe('What is this?');
  });

  test('startStars is added to the stars earned', async () => {
    await render(['recognized'], { startStars: 12 });
    await wait();
    expect(root().findByType(StarCounter).props.count).toBe(14);
  });
});

describe('summary (UI-4)', () => {
  async function finishRound(script) {
    const rec = await render(script);
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    return rec;
  }

  test('when nothing was named the summary says tried, not 0 of N', async () => {
    await render(Array(10).fill('incorrect')); // 2 words x 5 tries each, both move on
    for (let word = 0; word < 2; word++) {
      for (let attempt = 0; attempt < 4; attempt++) {
        await wait();
        await press('listen-button');
      }
      await wait();
      await press('next');
    }
    expect(root().findAllByType(Text).some((t) => t.props.children === 'You tried 2 things!')).toBe(true);
    expect(root().findAllByType(Text).some((t) => t.props.children === 'You named 0 of 2 things!')).toBe(false);
  });

  test('two right answers give 4 stars and Play again restarts', async () => {
    await finishRound(['recognized', 'recognized']);
    expect(root().findByType(StarCounter).props.count).toBe(4);
    expect(root().findAllByType(Text).some((t) => t.props.children === 'You named 2 of 2 things!')).toBe(true);
    await press('play-again');
    expect(has('listening')).toBe(true);
    expect(root().findByType(StarCounter).props.count).toBe(0);
  });

  test('a hinted answer gives 1 star and Done calls onDone', async () => {
    const onDone = jest.fn();
    await render(['incorrect', 'incorrect', 'recognized', 'recognized'], { onDone });
    await wait();
    await press('listen-button');
    await wait();
    await press('listen-button');
    await wait();
    await press('next');
    await wait();
    await press('next');
    expect(root().findByType(StarCounter).props.count).toBe(3);
    await press('done');
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('listening control', () => {
  test('a double tap on listen starts one listen only', async () => {
    const rec = await render(['incorrect']);
    await wait();
    const spy = jest.spyOn(rec, 'recognize');
    const button = root().findByProps({ testID: 'listen-button' });
    await act(async () => {
      button.props.onPress();
      button.props.onPress();
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(has('listening')).toBe(true);
    await wait();
  });

  test('tapping while listening does nothing', async () => {
    const rec = await render([]);
    const spy = jest.spyOn(rec, 'recognize');
    expect(has('listen-button')).toBe(false);
    await wait();
    expect(spy).not.toHaveBeenCalled();
  });

  test('unmounting cancels listening and leaves no timers', async () => {
    const rec = createMockRecognizer({ script: ['recognized'] });
    const cancel = jest.spyOn(rec, 'cancel');
    await render([], { recognizer: rec });
    const clear = jest.spyOn(global, 'clearTimeout');
    await act(async () => tree.unmount());
    tree = null;
    expect(cancel).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled(); // the recogniser's listen timer is cleared
  });

  test('holding the exit button cancels listening and calls onExit', async () => {
    const onExit = jest.fn();
    const rec = createMockRecognizer();
    const cancel = jest.spyOn(rec, 'cancel');
    await render([], { recognizer: rec, onExit });
    await act(async () => root().findByType(HoldToExitButton).props.onExit());
    expect(cancel).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });
});

describe('flow rules (reviewer)', () => {
  test('after a miss it waits for a tap: no listen loop when the child stays silent', async () => {
    const rec = await render(['no_response', 'no_response']);
    await wait();
    const spy = jest.spyOn(rec, 'recognize');
    await wait(20000);
    expect(spy).not.toHaveBeenCalled();
    expect(has('listen-button')).toBe(true);
  });

  test('hint level climbs: clue, then first sound, then say it with me', async () => {
    await render(['incorrect', 'incorrect', 'incorrect', 'incorrect']);
    const word = shownWord();
    const item = objectItem(IDS.find((id) => objectItem(id).en.word === word));
    await wait();
    await press('listen-button');
    await wait();
    expect(bubble()).toBe(item.en.clue);
    await press('listen-button');
    await wait();
    expect(bubble()).toBe(`It starts with "${word[0]}".`);
    await press('listen-button');
    await wait();
    expect(bubble()).toBe(`Say it with me: ${word}`);
  });

  test('unclear answers never bring a hint and never cost stars', async () => {
    await render(['inconclusive', 'inconclusive', 'recognized']);
    await wait();
    await press('listen-button');
    await wait();
    expect(bubble()).toBe("I couldn't hear that well. Let's try once more!");
    await press('listen-button');
    await wait();
    expect(root().findByType(StarCounter).props.count).toBe(2);
  });

  test('stars are given once per word even if Next is double tapped', async () => {
    await render(['recognized', 'recognized']);
    await wait();
    const next = root().findByProps({ testID: 'next' });
    await act(async () => { next.props.onPress(); next.props.onPress(); });
    expect(root().findByType(StarCounter).props.count).toBe(2);
    expect(has('listening')).toBe(true);
    await wait();
    expect(root().findByType(StarCounter).props.count).toBe(4);
  });

  test('a result cancelled by exit is ignored (no feedback, no stars)', async () => {
    const onExit = jest.fn();
    await render(['recognized'], { onExit });
    await act(async () => root().findByType(HoldToExitButton).props.onExit());
    await wait();
    expect(bubble()).toBe('What is this?');
    expect(root().findByType(StarCounter).props.count).toBe(0);
  });

  test('Play again starts a fresh round with each word once', async () => {
    await render(['recognized', 'recognized', 'recognized', 'recognized']);
    for (let i = 0; i < 2; i++) { await wait(); await press('next'); }
    await press('play-again');
    const seen = [];
    for (let i = 0; i < 2; i++) {
      seen.push(shownWord());
      await wait();
      await press('next');
    }
    expect(new Set(seen).size).toBe(2);
    expect(root().findByType(StarCounter).props.count).toBe(4);
  });
});

describe('Urdu (BR-3)', () => {
  test('uses Urdu text, each script in its own Text, right to left', async () => {
    await render(['incorrect'], { language: 'ur' });
    expect(bubble()).toBe('یہ کیا ہے؟');
    expect(root().findByType(HoldToExitButton).props.label).toBe('والدین: باہر نکلنے کے لیے دبا کر رکھیں');
    const word = shownWord('ur');
    expect(word).toBeTruthy();
    const texts = root().findAllByType(Text);
    // No Text mixes Urdu and Latin letters, and none nests another Text.
    texts.forEach((t) => {
      const s = typeof t.props.children === 'string' ? t.props.children : '';
      expect(/[؀-ۿ]/.test(s) && /[A-Za-z]/.test(s)).toBe(false);
      expect(typeof t.props.children === 'object' && !Array.isArray(t.props.children) ? t.props.children : null).toBeNull();
    });
    const urdu = texts.find((t) => t.props.children === word);
    expect([].concat(urdu.props.style).flat().some((s) => s && s.writingDirection === 'rtl')).toBe(true);
    await wait();
    expect(bubble()).toBe('اچھی کوشش! پھر سے بولیں۔');
  });
});

describe('rewards (FR-6, FR-8, BR-19)', () => {
  const fakeRewards = (result = { totalStars: 4, todayStars: 4, milestoneReachedToday: false, milestoneJustReached: false }) =>
    ({ addStars: jest.fn(async () => result) });
  const finish = async (script, props) => {
    await render(script, props);
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
  };

  test('saves the round stars once for this child when the round ends', async () => {
    const rewards = fakeRewards();
    await finish(['recognized', 'recognized'], { childId: 'kid-1', rewards, now: () => 123 });
    expect(rewards.addStars).toHaveBeenCalledTimes(1);
    expect(rewards.addStars).toHaveBeenCalledWith('kid-1', 4, 123);
    expect(has('milestone-badge')).toBe(false);
    await wait(5000);
    expect(rewards.addStars).toHaveBeenCalledTimes(1);
  });

  test('shows the daily badge when the milestone is just reached, and hides it on Play again', async () => {
    const rewards = fakeRewards({ totalStars: 10, todayStars: 10, milestoneReachedToday: true, milestoneJustReached: true });
    await finish(['recognized', 'recognized'], { childId: 'kid-1', rewards });
    expect(root().findAllByType(MilestoneBadge)).toHaveLength(1);
    await press('play-again');
    expect(root().findAllByType(MilestoneBadge)).toHaveLength(0);
  });

  test('a double tap on Done does not add stars again', async () => {
    const rewards = fakeRewards();
    const onDone = jest.fn();
    await finish(['recognized', 'recognized'], { childId: 'kid-1', rewards, onDone });
    await act(async () => {
      const done = root().findByProps({ testID: 'done' });
      done.props.onPress();
      done.props.onPress();
    });
    expect(rewards.addStars).toHaveBeenCalledTimes(1);
  });

  test('nothing is saved without a child id', async () => {
    const rewards = fakeRewards();
    await finish(['recognized', 'recognized'], { rewards });
    expect(rewards.addStars).not.toHaveBeenCalled();
  });

  test('a round with no stars saves nothing', async () => {
    const rewards = fakeRewards();
    await render(Array(10).fill('incorrect'), { childId: 'kid-1', rewards });
    for (let word = 0; word < 2; word++) {
      for (let attempt = 0; attempt < 4; attempt++) {
        await wait();
        await press('listen-button');
      }
      await wait();
      await press('next');
    }
    expect(has('done')).toBe(true);
    expect(rewards.addStars).not.toHaveBeenCalled();
  });

  test('Play again saves the next round too', async () => {
    const rewards = fakeRewards();
    await finish(['recognized', 'recognized', 'recognized', 'recognized'], { childId: 'kid-1', rewards });
    await press('play-again');
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    expect(rewards.addStars).toHaveBeenCalledTimes(2);
  });

  test('a late milestone from the last round does not show on the next round', async () => {
    let release;
    const addStars = jest.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }))
      .mockResolvedValue({ milestoneJustReached: false });
    const script = ['recognized', 'recognized', 'recognized', 'recognized'];
    await finish(script, { childId: 'kid-1', rewards: { addStars } });
    await press('play-again');
    await act(async () => release({ milestoneJustReached: true }));
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    expect(addStars).toHaveBeenCalledTimes(2);
    expect(root().findAllByType(MilestoneBadge)).toHaveLength(0);
  });

  test('a slow save finishing after unmount sets no state', async () => {
    let release;
    const rewards = { addStars: jest.fn(() => new Promise((resolve) => { release = resolve; })) };
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await finish(['recognized', 'recognized'], { childId: 'kid-1', rewards });
    await act(async () => tree.unmount());
    tree = null;
    await act(async () => release({ milestoneJustReached: true }));
    expect(error).not.toHaveBeenCalled();
  });

  test('a failing save does not break the summary', async () => {
    const rewards = { addStars: jest.fn(async () => { throw new Error('disk'); }) };
    await finish(['recognized', 'recognized'], { childId: 'kid-1', rewards });
    expect(has('done')).toBe(true);
  });
});
