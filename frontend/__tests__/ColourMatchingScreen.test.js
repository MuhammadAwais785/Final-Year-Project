import React, { useEffect } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import SpeechBubble from '../src/components/SpeechBubble';
import StarCounter from '../src/components/StarCounter';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import ColourMatchingScreen from '../src/modules/m03_games/ColourMatchingScreen';
import { colourItem } from '../src/modules/m03_games/colourContent';
import { createMockRecognizer } from '../src/modules/m03_games/mockRecognizer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

const IDS = ['red', 'blue'];
const { act } = ReactTestRenderer;

function WithChild({ child, children }) {
  const { child: current, setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return current ? children : null;
}

let tree;
async function render(script, { language = 'en', childId, ...props } = {}) {
  const recognizer = createMockRecognizer({ script });
  await act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <WithChild child={{ _id: childId, name: 'Ali', language }}>
          <ColourMatchingScreen recognizer={recognizer} itemIds={IDS} roundSize={2} {...props} />
        </WithChild>
      </ChildProfileProvider>,
    );
  });
}

const root = () => tree.root;
const bubble = () => root().findByType(SpeechBubble).props.text;
const has = (testID) => root().findAllByProps({ testID }).length > 0;
const press = async (testID) => act(async () => root().findByProps({ testID }).props.onPress());
const wait = async (ms = 1500) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });
const swatch = () => root().findByProps({ testID: 'swatch' });
const shownColour = () => IDS.map(colourItem).find((c) => c.swatch === swatch().props.style[1].backgroundColor);

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

describe('colour matching game (UC-12)', () => {
  test('shows a swatch labelled with the colour word and asks for the colour', async () => {
    await render([]);
    const colour = shownColour();
    expect(colour).toBeTruthy();
    expect(swatch().props.accessibilityLabel).toBe(colour.en.word);
    expect(bubble()).toBe('What colour is this?');
    expect(has('listening')).toBe(true);
  });

  test('a right answer shows praise and stars, then Next colour moves on', async () => {
    await render(['recognized']);
    const first = shownColour().id;
    await wait();
    expect(bubble()).toBe('Great job!');
    expect(has('correct-tick')).toBe(true);
    expect(root().findByType(StarCounter).props.count).toBe(2);
    expect(root().findByProps({ testID: 'next' }).props.title).toBe('Next colour');
    await press('next');
    expect(shownColour().id).not.toBe(first);
  });

  test('two misses bring the colour clue as a hint', async () => {
    await render(['incorrect', 'incorrect']);
    const colour = shownColour();
    await wait();
    await press('listen-button');
    await wait();
    expect(bubble()).toBe(colour.en.clue);
  });

  test('summary says how many colours were named', async () => {
    await render(['recognized', 'recognized']);
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    expect(root().findAllByType(Text).some((t) => t.props.children === 'You named 2 of 2 colours!')).toBe(true);
    expect(has('play-again')).toBe(true);
  });

  test('saves the round stars once', async () => {
    const rewards = { addStars: jest.fn(async () => ({ milestoneJustReached: false })) };
    await render(['recognized', 'recognized'], { childId: 'kid-1', rewards, now: () => 5 });
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    await wait(5000);
    expect(rewards.addStars).toHaveBeenCalledTimes(1);
    expect(rewards.addStars).toHaveBeenCalledWith('kid-1', 4, 5);
  });

  test('Urdu: own Text per script, Urdu label on the swatch', async () => {
    await render(['incorrect'], { language: 'ur' });
    const colour = shownColour();
    expect(swatch().props.accessibilityLabel).toBe(colour.ur.word);
    expect(bubble()).toBe('یہ کون سا رنگ ہے؟');
    const word = root().findAllByType(Text).find((t) => t.props.children === colour.ur.word);
    expect(word).toBeTruthy();
    root().findAllByType(Text).forEach((t) => {
      const s = typeof t.props.children === 'string' ? t.props.children : '';
      expect(/[؀-ۿ]/.test(s) && /[A-Za-z]/.test(s)).toBe(false);
    });
    expect([].concat(word.props.style).flat().some((s) => s && s.writingDirection === 'rtl')).toBe(true);
  });
  test('when nothing was named the summary says colours were tried, never object wording', async () => {
    await render(Array(10).fill('incorrect'));
    for (let colour = 0; colour < 2; colour++) {
      for (let attempt = 0; attempt < 4; attempt++) {
        await wait();
        await press('listen-button');
      }
      await wait();
      await press('next');
    }
    const texts = root().findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('You tried 2 colours!');
    expect(texts.some((t) => typeof t === 'string' && /things/.test(t))).toBe(false);
  });

  test('Urdu summary uses colour wording', async () => {
    await render(['recognized', 'recognized'], { language: 'ur' });
    for (let i = 0; i < 2; i++) {
      await wait();
      await press('next');
    }
    const texts = root().findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('آپ نے 2 میں سے 2 رنگوں کے نام بتائے!');
    expect(texts.some((t) => typeof t === 'string' && /چیز/.test(t))).toBe(false);
  });
});
