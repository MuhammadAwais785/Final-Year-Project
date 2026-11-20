import React, { useEffect } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HoldToExitButton, { HOLD_MS } from '../src/components/HoldToExitButton';
import StarCounter from '../src/components/StarCounter';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import { BREAK_TEXT } from '../src/modules/m07_intervention/calmingBreakText';
import BreathingStep, { BREATH_CYCLES, BREATH_MS } from '../src/modules/m07_intervention/BreathingStep';
import CalmingBreakScreen from '../src/modules/m07_intervention/CalmingBreakScreen';
import { touch } from '../src/theme';

const { act } = ReactTestRenderer;
const flat = (node) => StyleSheet.flatten(node.props.style);

function SetChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child), [child, setChild]);
  return null;
}

let tree;
let stopSpy;

async function render(child, props = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <SetChild child={child} />
        <CalmingBreakScreen {...props} />
      </ChildProfileProvider>,
    );
  });
  return tree.root;
}

const press = (root, testID) => act(async () => root.findByProps({ testID }).props.onPress());
const isSelected = (root, id) => root.findAllByProps({ testID: id }).find((n) => n.props.accessibilityState).props.accessibilityState.selected;
const texts = (root) => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
const advance = (ms) => act(async () => { jest.advanceTimersByTime(ms); });
// Each phase schedules the next timer after a re-render, so step one phase at a time.
const breatheFor = async (phases) => { for (let i = 0; i < phases; i += 1) await advance(BREATH_MS); };

const ALI = { name: 'Ali', language: 'en' };

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  // Animated timing is mocked so no animation keeps running; stop() is checked on cleanup.
  stopSpy = jest.fn();
  jest.spyOn(Animated, 'timing').mockReturnValue({ start: jest.fn(), stop: stopSpy });
});

afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.clearAllTimers(); // React/RN keep a few internal timers after unmount; ours are checked in the cleanup test
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('CalmingBreakScreen (FR-20)', () => {
  test('steps from start through breathing, sounds and ready to onDone', async () => {
    const onDone = jest.fn();
    const root = await render(ALI, { onDone });
    expect(texts(root)).toContain(BREAK_TEXT.en.start);
    await press(root, 'lets-breathe');
    expect(texts(root)).toContain(BREAK_TEXT.en.breatheIn);
    await breatheFor(BREATH_CYCLES * 2);
    expect(texts(root)).toContain(BREAK_TEXT.en.soundsTitle);
    await press(root, 'sounds-continue');
    expect(texts(root)).toContain(BREAK_TEXT.en.ready);
    expect(onDone).not.toHaveBeenCalled();
    await press(root, 'lets-play');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('pressing "Let\'s play" twice on the ready step calls onDone once', async () => {
    const onDone = jest.fn();
    const root = await render(ALI, { initialStep: 'ready', onDone });
    await press(root, 'lets-play');
    await press(root, 'lets-play');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('calm and mint buttons are at least a child touch target tall', async () => {
    const root = await render(ALI, { onDone: jest.fn() });
    const host = (id) => root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];
    expect(flat(host('lets-breathe')).minHeight).toBeGreaterThanOrEqual(touch.child);
    await press(root, 'lets-breathe');
    await breatheFor(BREATH_CYCLES * 2);
    await press(root, 'sounds-continue');
    expect(flat(host('lets-play')).minHeight).toBeGreaterThanOrEqual(touch.child);
  });

  test('sounds can be skipped, and picking a tile only highlights it', async () => {
    const root = await render(ALI, { initialStep: 'sounds' });
    expect(texts(root)).toContain('Skip');
    await press(root, 'sound-rain');
    expect(isSelected(root, 'sound-rain')).toBe(true);
    expect(isSelected(root, 'sound-birds')).toBe(false);
    expect(texts(root)).toContain('Next');
    await press(root, 'sounds-continue');
    expect(texts(root)).toContain(BREAK_TEXT.en.ready);
  });

  test('"I feel better" leaves breathing early and goes to ready', async () => {
    const root = await render(ALI, { initialStep: 'breathing' });
    await press(root, 'feel-better');
    expect(texts(root)).toContain(BREAK_TEXT.en.ready);
  });

  test('breathing switches between in and out over time', async () => {
    const root = await render(ALI, { initialStep: 'breathing' });
    expect(texts(root)).toContain('Breathe in…');
    await advance(BREATH_MS);
    expect(texts(root)).toContain('Breathe out…');
    await advance(BREATH_MS);
    expect(texts(root)).toContain('Breathe in…');
    const targets = Animated.timing.mock.calls.map(([, config]) => config.toValue);
    expect(targets).toEqual([1.4, 0.85, 1.4]);
    expect(Animated.timing.mock.calls.every(([, c]) => c.useNativeDriver === true && c.duration === BREATH_MS)).toBe(true);
  });

  test('breathing ends after a fixed number of cycles', async () => {
    const onDone = jest.fn();
    await act(async () => { tree = ReactTestRenderer.create(<BreathingStep language="en" onDone={onDone} />); });
    await breatheFor(BREATH_CYCLES * 2 - 1);
    await advance(BREATH_MS - 1);
    expect(onDone).not.toHaveBeenCalled();
    await advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('unmounting on the last breath clears its timer and stops the animation', async () => {
    const onDone = jest.fn();
    await act(async () => { tree = ReactTestRenderer.create(<BreathingStep language="en" onDone={onDone} />); });
    await breatheFor(BREATH_CYCLES * 2 - 1); // now on the last breath: its timer is the one that calls onDone
    stopSpy.mockClear();
    await act(async () => tree.unmount());
    tree = null;
    expect(stopSpy).toHaveBeenCalled(); // the circle animation is stopped
    await advance(BREATH_MS * 2); // a leftover timer would call onDone here
    expect(onDone).not.toHaveBeenCalled();
  });

  test('"I feel better" on the last breath leaves no timer that moves the screen on', async () => {
    const root = await render(ALI, { initialStep: 'breathing' });
    await breatheFor(BREATH_CYCLES * 2 - 1);
    await press(root, 'feel-better');
    expect(texts(root)).toContain(BREAK_TEXT.en.ready);
    await advance(BREATH_MS * 2); // a leftover breathing timer would jump to the sounds step
    expect(texts(root)).toContain(BREAK_TEXT.en.ready);
    expect(texts(root)).not.toContain(BREAK_TEXT.en.soundsTitle);
  });

  test('hold to exit calls onExit only after the full hold', async () => {
    const onExit = jest.fn();
    const root = await render(ALI, { onExit });
    const exit = root.findByType(HoldToExitButton);
    expect(exit.props.label).toBe(BREAK_TEXT.en.exit);
    await act(async () => exit.findByProps({ accessibilityRole: 'button' }).props.onPressIn());
    await advance(HOLD_MS - 1);
    expect(onExit).not.toHaveBeenCalled();
    await advance(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  test.each(['start', 'breathing', 'sounds', 'ready'])('%s step has no star counter, no Home button and a hold to exit (BR-28)', async (step) => {
    const root = await render(ALI, { initialStep: step });
    expect(root.findAllByType(StarCounter)).toHaveLength(0);
    expect(root.findAllByType(HoldToExitButton)).toHaveLength(1);
    expect(texts(root).join(' ')).not.toMatch(/home|star|★/i);
    expect(root.findAll((n) => /home/i.test(String(n.props.accessibilityLabel ?? '')))).toHaveLength(0);
  });

  test('Urdu is right to left with each script in its own Text (BR-3)', async () => {
    const root = await render({ name: 'علی', language: 'ur' });
    const all = root.findAllByType(Text);
    expect(texts(root)).toContain(BREAK_TEXT.ur.start);
    all.forEach((t) => {
      const kids = [].concat(t.props.children);
      expect(kids.every((k) => typeof k === 'string')).toBe(true); // never nested Text
      const hasUrdu = /[؀-ۿ]/.test(kids.join(''));
      const hasLatin = /[A-Za-z]/.test(kids.join(''));
      expect(hasUrdu && hasLatin).toBe(false);
    });
    const bubble = all.find((t) => t.props.children === BREAK_TEXT.ur.start);
    expect(flat(bubble).writingDirection).toBe('rtl');
    await press(root, 'lets-breathe');
    expect(texts(root)).toContain(BREAK_TEXT.ur.breatheIn);
    await advance(BREATH_MS);
    expect(texts(root)).toContain('سانس باہر چھوڑیں…');
  });

  test('the break never reads or writes stars, progress or sessions (BR-28)', () => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '../src/modules/m07_intervention');
    fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => {
      const imports = fs.readFileSync(path.join(dir, f), 'utf8').match(/from '[^']+'/g) || [];
      imports.forEach((line) => expect(line).not.toMatch(/store|api\/|m03_games|StarCounter|AsyncStorage/i));
    });
  });
});

describe('ActionButton language', () => {
  const ActionButton = require('../src/components/ActionButton').default;
  const label = (lang) => {
    let t;
    act(() => { t = ReactTestRenderer.create(<ActionButton title="x" {...(lang ? { language: lang } : {})} />); });
    const style = flat(t.root.findByType(Text));
    act(() => t.unmount());
    return style;
  };

  test('defaults to English and uses the Nastaliq font right to left for Urdu', () => {
    expect(label().fontFamily).toBe('PlusJakartaSans-Bold');
    expect(label().writingDirection).toBeUndefined();
    expect(label('ur').fontFamily).toMatch(/^NotoNastaliqUrdu-/);
    expect(label('ur').writingDirection).toBe('rtl');
  });
});
