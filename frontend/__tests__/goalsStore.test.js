import { getGoals, saveGoals } from '../src/modules/m01_onboarding/goalsStore';

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

const GOOD = [{ id: 'a', type: 'weekly_words', target: 10 }];
beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('goalsStore (FR-3)', () => {
  test('saves and reads goals per child', async () => {
    await saveGoals('one', GOOD);
    await saveGoals('two', [{ id: 'b', type: 'daily_minutes', target: 10 }]);
    expect(await getGoals('one')).toEqual(GOOD);
    expect((await getGoals('two'))[0].type).toBe('daily_minutes');
    expect(await getGoals('three')).toBeNull();
  });

  test('rejects a missing child id', async () => {
    await expect(saveGoals(undefined, GOOD)).rejects.toThrow();
    expect(await getGoals(undefined)).toBeNull();
  });

  test('does not save invalid goals', async () => {
    await expect(saveGoals('one', [{ id: 'a', type: 'weekly_words', target: 0 }])).rejects.toMatchObject({ errors: [{ index: 0, code: 'words_range' }] });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('drops entries that are not real goals', async () => {
    await AsyncStorage.setItem('@silent_screen/goals/one', '[null,{"id":"a","type":"weekly_words","target":10}]');
    expect(await getGoals('one')).toEqual([{ id: 'a', type: 'weekly_words', target: 10 }]);
  });

  test('a corrupt record reads as null', async () => {
    await AsyncStorage.setItem('@silent_screen/goals/one', '{not json');
    expect(await getGoals('one')).toBeNull();
    await AsyncStorage.setItem('@silent_screen/goals/one', '{"a":1}');
    expect(await getGoals('one')).toBeNull();
  });
});
