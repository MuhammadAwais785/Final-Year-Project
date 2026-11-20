import { pickActivityAfterBreak } from '../src/modules/m07_intervention/afterBreak';
import { easyRoundFor } from '../src/modules/m03_games/easyRound';
import { colourItem } from '../src/modules/m03_games/colourContent';
import { objectItem } from '../src/modules/m03_games/objectNamingContent';
import { pickPrompts } from '../src/modules/m03_games/round';
import { GAME } from '../src/utils/constants';

const act = (id, level, available = true) => ({ id, level, available });

describe('pickActivityAfterBreak', () => {
  it('skips the stressed activity', () => {
    const activities = [act('object_naming', 1), act('colour_matching', 2)];
    expect(pickActivityAfterBreak({ stressedActivity: 'object_naming', activities })).toBe('colour_matching');
  });

  it('chooses the lowest level', () => {
    const activities = [act('a', 3), act('b', 1), act('c', 2)];
    expect(pickActivityAfterBreak({ stressedActivity: 'x', activities })).toBe('b');
  });

  it('keeps list order on ties', () => {
    const activities = [act('a', 2), act('b', 1), act('c', 1)];
    expect(pickActivityAfterBreak({ stressedActivity: 'x', activities })).toBe('b');
  });

  it('ignores unavailable activities', () => {
    const activities = [act('a', 1, false), act('b', 3)];
    expect(pickActivityAfterBreak({ stressedActivity: 'x', activities })).toBe('b');
  });

  it('returns the stressed activity when it is the only one available', () => {
    const activities = [act('a', 1), act('b', 1, false)];
    expect(pickActivityAfterBreak({ stressedActivity: 'a', activities })).toBe('a');
  });

  it('returns null for an empty or all-unavailable list', () => {
    expect(pickActivityAfterBreak({ stressedActivity: 'a', activities: [] })).toBeNull();
    expect(pickActivityAfterBreak({ stressedActivity: 'a', activities: [act('a', 1, false), act('b', 1, false)] })).toBeNull();
  });

  it('handles a null activities list and an unknown stressed activity', () => {
    expect(pickActivityAfterBreak({ stressedActivity: 'a', activities: null })).toBeNull();
    expect(pickActivityAfterBreak({ stressedActivity: undefined, activities: [act('a', 2), act('b', 1)] })).toBe('b');
  });

  it('puts an activity with no level after every levelled one', () => {
    const activities = [act('a', undefined), act('b', 2)];
    expect(pickActivityAfterBreak({ stressedActivity: 'x', activities })).toBe('b');
  });

  it('does not mutate its input', () => {
    const activities = [act('a', 2), act('b', 1)];
    const copy = JSON.parse(JSON.stringify(activities));
    pickActivityAfterBreak({ stressedActivity: 'a', activities });
    expect(activities).toEqual(copy);
  });
  it('skips empty entries in the list', () => {
    expect(pickActivityAfterBreak({ stressedActivity: 'x', activities: [null, undefined, act('b', 1)] })).toBe('b');
  });
});

describe('easyRoundFor', () => {
  it('gives level-1 object naming ids and a short round', () => {
    const round = easyRoundFor('object_naming');
    expect(round.roundSize).toBe(3);
    expect(round.roundSize).toBe(GAME.EASY_ROUND_SIZE);
    expect(round.itemIds.length).toBeGreaterThan(0);
    round.itemIds.forEach((id) => expect(objectItem(id).level).toBe(1));
  });

  it('makes a valid round of 3 distinct prompts', () => {
    const { itemIds, roundSize } = easyRoundFor('object_naming');
    expect(itemIds.length).toBeGreaterThanOrEqual(roundSize);
    const picked = pickPrompts(itemIds, roundSize);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('gives level-1 colour ids and a short round for colour matching', () => {
    const round = easyRoundFor('colour_matching');
    expect(round.roundSize).toBe(GAME.EASY_ROUND_SIZE);
    expect(round.itemIds.length).toBeGreaterThanOrEqual(round.roundSize);
    round.itemIds.forEach((id) => expect(colourItem(id).level).toBe(1));
  });

  it('returns null for unknown or unbuilt activities', () => {
    expect(easyRoundFor('nope')).toBeNull();
  });

  it('returns a fresh list each call', () => {
    const a = easyRoundFor('object_naming');
    a.itemIds.pop();
    expect(easyRoundFor('object_naming').itemIds.length).toBeGreaterThan(a.itemIds.length);
  });
});
