import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import GameTile from '../src/components/GameTile';
import HoldToExitButton, { HOLD_MS } from '../src/components/HoldToExitButton';
import SpeechBubble from '../src/components/SpeechBubble';
import StarCounter from '../src/components/StarCounter';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import ChildHomeScreen, { GAMES } from '../src/modules/m03_games/ChildHomeScreen';

const flat = (node) => StyleSheet.flatten(node.props.style);

function SetChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return null;
}

async function render(child, props = {}) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <SetChild child={child} />
        <ChildHomeScreen {...props} />
      </ChildProfileProvider>,
    );
  });
  return tree.root;
}

beforeEach(() => jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false));
afterEach(() => jest.restoreAllMocks());

describe('ChildHomeScreen (UI-06)', () => {
  test('greets the child by name, shows stars and the three games in English', async () => {
    const root = await render({ name: 'Ali', language: 'en' }, { stars: 12 });
    expect(root.findByType(SpeechBubble).props.text).toBe("Hello Ali! Let's play!");
    expect(root.findByType(StarCounter).props.count).toBe(12);
    expect(root.findAllByType(GameTile).map((t) => t.props.title)).toEqual(['What is this?', 'Colours', 'Copy the sound']);
    expect(root.findByType(HoldToExitButton).props.label).toBe('Grown-ups: hold to exit');
  });

  test("uses the child's language: Urdu text, right to left (BR-3)", async () => {
    const root = await render({ name: 'علی', language: 'ur' });
    expect(root.findByType(SpeechBubble).props.text).toBe('ہیلو علی! آئیں کھیلیں!');
    expect(root.findAllByType(GameTile).map((t) => t.props.title)).toEqual(['یہ کیا ہے؟', 'رنگ', 'آواز دہرائیں']);
    expect(root.findAllByType(GameTile).every((t) => t.props.language === 'ur')).toBe(true);
    expect(root.findByType(HoldToExitButton).props.label).toBe('والدین: باہر نکلنے کے لیے دبا کر رکھیں');
  });

  test('greets without a name when no child is selected yet', async () => {
    const root = await render(null);
    expect(root.findByType(SpeechBubble).props.text).toBe("Hello! Let's play!");
  });

  test('tapping a game tile reports which game was chosen', async () => {
    const onSelectGame = jest.fn();
    const root = await render({ name: 'Ali', language: 'en' }, { onSelectGame });
    GAMES.forEach((game) => {
      ReactTestRenderer.act(() => root.findByProps({ testID: `game-${game.id}` }).props.onPress());
    });
    expect(onSelectGame.mock.calls).toEqual([['objectNaming'], ['colourMatching'], ['soundImitation']]);
  });

  test('has no bottom navigation: the hold button is the only way out', async () => {
    const root = await render({ name: 'Ali', language: 'en' });
    const buttons = root.findAll((n) => n.props.accessibilityRole === 'button' && typeof n.type === 'string');
    const labels = buttons.map((b) => b.props.accessibilityLabel);
    expect(labels.sort()).toEqual(['Colours', 'Copy the sound', 'Grown-ups: hold to exit', 'What is this?']);
  });
});

describe('HoldToExitButton (UC-22)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function renderButton(onExit) {
    let tree;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<HoldToExitButton label="Grown-ups: hold to exit" onExit={onExit} />);
    });
    return tree.root.findByProps({ accessibilityRole: 'button' });
  }

  test('exits only after holding for the full time', () => {
    const onExit = jest.fn();
    const button = renderButton(onExit);
    ReactTestRenderer.act(() => button.props.onPressIn());
    ReactTestRenderer.act(() => jest.advanceTimersByTime(HOLD_MS - 1));
    expect(onExit).not.toHaveBeenCalled();
    ReactTestRenderer.act(() => jest.advanceTimersByTime(1));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  test('a quick tap or letting go early does not exit', () => {
    const onExit = jest.fn();
    const button = renderButton(onExit);
    ReactTestRenderer.act(() => {
      button.props.onPressIn();
      jest.advanceTimersByTime(HOLD_MS / 2);
      button.props.onPressOut();
      jest.advanceTimersByTime(HOLD_MS);
    });
    expect(onExit).not.toHaveBeenCalled();
  });
});

describe('StarCounter', () => {
  test('shows one star and the number, with a spoken label', () => {
    let tree;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<StarCounter count={14} />);
    });
    const texts = tree.root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toEqual(['★', 14]);
    expect(tree.root.findByProps({ accessible: true }).props.accessibilityLabel).toBe('14 stars');
    expect(flat(tree.root.findAllByType(Text)[1]).fontFamily).toBe('PlusJakartaSans-ExtraBold');
  });
});
