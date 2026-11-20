import * as store from '../src/modules/m03_games/rewardStore';
import { GAME } from '../src/utils/constants';

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

const { addStars, getRewards } = store;
const M = GAME.DAILY_MILESTONE_STARS;
const DAY1 = new Date(2026, 10, 20, 10).getTime();
const DAY2 = new Date(2026, 10, 21, 10).getTime();

beforeEach(() => AsyncStorage.clear());

describe('rewardStore', () => {
  test('starts at zero', async () => {
    expect(await getRewards('a', DAY1)).toEqual({ totalStars: 0, todayStars: 0, milestoneReachedToday: false });
  });

  test('adds to the total and today', async () => {
    await addStars('a', 2, DAY1);
    const r = await addStars('a', 3, DAY1);
    expect(r).toMatchObject({ totalStars: 5, todayStars: 5, milestoneJustReached: false });
    expect(await getRewards('a', DAY1)).toEqual({ totalStars: 5, todayStars: 5, milestoneReachedToday: false });
  });

  test('today resets on a new day but the total stays', async () => {
    await addStars('a', M, DAY1);
    expect(await getRewards('a', DAY2)).toEqual({ totalStars: M, todayStars: 0, milestoneReachedToday: false });
    const r = await addStars('a', 2, DAY2);
    expect(r).toMatchObject({ totalStars: M + 2, todayStars: 2 });
  });

  test('the milestone is reported exactly once', async () => {
    expect((await addStars('a', M - 1, DAY1)).milestoneJustReached).toBe(false);
    const cross = await addStars('a', 2, DAY1);
    expect(cross).toMatchObject({ milestoneJustReached: true, milestoneReachedToday: true });
    expect((await addStars('a', 2, DAY1)).milestoneJustReached).toBe(false);
    expect((await addStars('a', M, DAY2)).milestoneJustReached).toBe(true); // a new day earns it again
  });

  test.each([[-2], [NaN], [1.5], [0], ['3'], [undefined], [Infinity]])('ignores bad input %p', async (bad) => {
    await addStars('a', 2, DAY1);
    const r = await addStars('a', bad, DAY1);
    expect(r).toMatchObject({ totalStars: 2, todayStars: 2, milestoneJustReached: false });
    expect((await getRewards('a', DAY1)).totalStars).toBe(2);
  });

  test('children are kept separate (BR-19)', async () => {
    await addStars('a', M, DAY1);
    await addStars('b', 3, DAY1);
    expect(await getRewards('a', DAY1)).toMatchObject({ totalStars: M, milestoneReachedToday: true });
    expect(await getRewards('b', DAY1)).toMatchObject({ totalStars: 3, milestoneReachedToday: false });
    const keys = AsyncStorage.setItem.mock.calls.map(([k]) => k);
    expect(keys.every((k) => k.includes('/a') || k.includes('/b'))).toBe(true);
    expect(new Set(keys).size).toBe(2);
  });

  test('two concurrent adds are both counted', async () => {
    const [x, y] = await Promise.all([addStars('a', 2, DAY1), addStars('a', 3, DAY1)]);
    expect(x.totalStars).toBe(2);
    expect(y.totalStars).toBe(5);
    expect((await getRewards('a', DAY1)).totalStars).toBe(5);
  });

  test('a failed write does not block later adds', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('disk'));
    await expect(addStars('a', 2, DAY1)).rejects.toThrow('disk');
    expect((await addStars('a', 2, DAY1)).totalStars).toBe(2);
  });

  test('a corrupt saved record reads as zero and is replaced on the next add', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('{not json');
    expect(await getRewards('a', DAY1)).toEqual({ totalStars: 0, todayStars: 0, milestoneReachedToday: false });
    AsyncStorage.getItem.mockResolvedValueOnce('{not json');
    expect((await addStars('a', 2, DAY1)).totalStars).toBe(2);
  });

  test('stars can never be removed (BR-28)', () => {
    expect(Object.keys(store).sort()).toEqual(['addStars', 'getRewards']);
  });
});
