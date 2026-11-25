import * as store from '../src/modules/m03_games/sessionStore';
import { createRound, applyResult } from '../src/modules/m03_games/round';
import { ACTIVITIES, SESSIONS } from '../src/utils/constants';

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

const { saveSession, getSessions, getUnsynced, markSynced } = store;

// A round with one wrong try then a right one; the result carries a 'heard' field that must never be kept.
function sampleRound() {
  let state = createRound(['cat', 'dog']);
  state = applyResult(state, { status: 'incorrect', score: 0.1, heard: 'secret words' }, 10).state;
  state = applyResult(state, { status: 'recognized', score: 0.9 }, 20).state;
  return state;
}
const input = (over = {}) => ({ activity: ACTIVITIES.OBJECT_NAMING, startedAt: 1, endedAt: 30, partial: false, round: sampleRound(), ...over });

beforeEach(() => AsyncStorage.clear());

describe('sessionStore', () => {
  test('saves the session shape and returns it', async () => {
    const s = await saveSession('a', input());
    expect(s).toEqual({
      clientId: expect.any(String), childId: 'a', activity: 'object_naming', startedAt: 1, endedAt: 30,
      stars: 2, practiced: 1, correct: 1, partial: false, synced: false,
    });
    expect(await getSessions('a')).toEqual([s]);
  });

  test('stores attempts with only the agreed fields and no heard text', async () => {
    const s = await saveSession('a', input());
    const { attempts } = await getUnsynced('a');
    expect(attempts).toEqual([
      { sessionClientId: s.clientId, promptId: 'cat', status: 'incorrect', score: 0.1, hintLevel: 0, at: 10 },
      { sessionClientId: s.clientId, promptId: 'cat', status: 'recognized', score: 0.9, hintLevel: 0, at: 20 },
    ]);
    const raw = [...AsyncStorage.setItem.mock.calls].pop()[1];
    expect(raw).not.toMatch(/heard|secret/);
  });

  test('partial flag is kept', async () => {
    expect((await saveSession('a', input({ partial: true }))).partial).toBe(true);
  });

  test('sessions are per child', async () => {
    await saveSession('a', input());
    await saveSession('b', input({ activity: ACTIVITIES.COLOUR_MATCHING }));
    expect(await getSessions('a')).toHaveLength(1);
    expect((await getSessions('b'))[0].activity).toBe('colour_matching');
    expect(await getSessions('c')).toEqual([]);
  });

  test('newest first', async () => {
    await saveSession('a', input({ endedAt: 1 }));
    await saveSession('a', input({ endedAt: 2 }));
    expect((await getSessions('a')).map((s) => s.endedAt)).toEqual([2, 1]);
  });

  test('unsynced and markSynced keep everything', async () => {
    const one = await saveSession('a', input());
    const two = await saveSession('a', input());
    await markSynced('a', [one.clientId]);
    const pending = await getUnsynced('a');
    expect(pending.sessions.map((s) => s.clientId)).toEqual([two.clientId]);
    expect(pending.attempts.every((a) => a.sessionClientId === two.clientId)).toBe(true);
    const all = await getSessions('a');
    expect(all).toHaveLength(2);
    expect(all.find((s) => s.clientId === one.clientId).synced).toBe(true);
    await markSynced('a', undefined);
    expect(await getSessions('a')).toHaveLength(2);
  });

  test('cap drops the oldest synced sessions and their attempts', async () => {
    const first = await saveSession('a', input());
    await markSynced('a', [first.clientId]);
    for (let i = 0; i < SESSIONS.MAX_PER_CHILD; i++) await saveSession('a', input());
    const all = await getSessions('a');
    expect(all).toHaveLength(SESSIONS.MAX_PER_CHILD);
    expect(all.some((s) => s.clientId === first.clientId)).toBe(false);
    const { attempts } = await getUnsynced('a');
    expect(attempts.some((a) => a.sessionClientId === first.clientId)).toBe(false);
    expect(attempts).toHaveLength(SESSIONS.MAX_PER_CHILD * 2);
  });

  test('cap never drops an unsynced session, even an old one', async () => {
    const synced = await saveSession('a', input());
    const oldest = await saveSession('a', input());
    await markSynced('a', [synced.clientId]);
    for (let i = 0; i < SESSIONS.MAX_PER_CHILD; i++) await saveSession('a', input());
    const ids = (await getSessions('a')).map((s) => s.clientId);
    expect(ids).toContain(oldest.clientId);
    expect(ids).not.toContain(synced.clientId);
  });

  test('when every session is unsynced, nothing is dropped past the cap', async () => {
    for (let i = 0; i < SESSIONS.MAX_PER_CHILD + 1; i++) await saveSession('a', input());
    const pending = await getUnsynced('a');
    expect(pending.sessions).toHaveLength(SESSIONS.MAX_PER_CHILD + 1);
    expect(pending.attempts).toHaveLength((SESSIONS.MAX_PER_CHILD + 1) * 2);
  });

  test('markSynced with unknown ids changes nothing', async () => {
    const s = await saveSession('a', input());
    await markSynced('a', ['nope']);
    expect((await getUnsynced('a')).sessions.map((x) => x.clientId)).toEqual([s.clientId]);
  });

  test('damaged entries inside the list are skipped, not crashed on', async () => {
    await AsyncStorage.setItem('@silent_screen/sessions/a', JSON.stringify({ sessions: [null, 3, { clientId: 'x', synced: false }], attempts: [null] }));
    const pending = await getUnsynced('a');
    expect(pending.sessions.map((s) => s.clientId)).toEqual(['x']);
    await expect(markSynced('a', ['x'])).resolves.toBeUndefined();
    await saveSession('a', input());
    expect(await getSessions('a')).toHaveLength(2);
  });

  test('damaged data reads as empty and can be saved over', async () => {
    await AsyncStorage.setItem('@silent_screen/sessions/a', '{not json');
    expect(await getSessions('a')).toEqual([]);
    await AsyncStorage.setItem('@silent_screen/sessions/a', JSON.stringify({ sessions: 5 }));
    expect(await getSessions('a')).toEqual([]);
    await saveSession('a', input());
    expect(await getSessions('a')).toHaveLength(1);
  });

  test('rejects a missing childId or a missing or unknown activity', async () => {
    await expect(saveSession('', input())).rejects.toThrow();
    await expect(saveSession('a', input({ activity: undefined }))).rejects.toThrow();
    await expect(saveSession('a', input({ activity: 'karaoke' }))).rejects.toThrow();
    await expect(markSynced(undefined, [])).rejects.toThrow();
    expect(await getSessions('a')).toEqual([]);
  });

  test('two concurrent saves are both kept', async () => {
    await Promise.all([saveSession('a', input()), saveSession('a', input())]);
    expect(await getSessions('a')).toHaveLength(2);
    expect((await getUnsynced('a')).attempts).toHaveLength(4);
  });
});
