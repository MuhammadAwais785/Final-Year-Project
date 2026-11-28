import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  syncChildOnboarding,
  syncChildSessions,
  syncWithRetry,
  toSyncPayload,
} from '../src/modules/m08_sync/syncService';

describe('M-08 syncService', () => {
  const storage = {};

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    AsyncStorage.getItem.mockImplementation(async (k) => (k in storage ? storage[k] : null));
    AsyncStorage.setItem.mockImplementation(async (k, v) => { storage[k] = v; });
    AsyncStorage.removeItem.mockImplementation(async (k) => { delete storage[k]; });
  });

  const sampleSession = {
    clientId: 's-1',
    childId: 'child-1',
    activity: 'object_naming',
    startedAt: 1700000000000,
    endedAt: 1700000090000,
    stars: 4,
    practiced: 2,
    correct: 2,
    partial: false,
    synced: false,
  };

  const sampleAttempt = {
    sessionClientId: 's-1',
    promptId: 'apple',
    status: 'recognized',
    score: 90,
    hintLevel: 0,
    at: 1700000030000,
  };

  test('toSyncPayload strips local synced flag and keeps BR-20 allowed keys only', () => {
    const payload = toSyncPayload({ sessions: [sampleSession], attempts: [sampleAttempt] });
    expect(payload.sessions[0]).not.toHaveProperty('synced');
    expect(Object.keys(payload.sessions[0]).sort()).toEqual([
      'activity',
      'childId',
      'clientId',
      'correct',
      'endedAt',
      'partial',
      'practiced',
      'stars',
      'startedAt',
    ]);
    expect(Object.keys(payload.attempts[0]).sort()).toEqual([
      'at',
      'hintLevel',
      'promptId',
      'score',
      'sessionClientId',
      'status',
    ]);
  });

  test('skips network call when nothing is unsynced', async () => {
    const sessionStore = {
      getUnsynced: jest.fn(async () => ({ sessions: [], attempts: [] })),
      markSynced: jest.fn(),
    };
    const postSync = jest.fn();

    const result = await syncChildSessions('child-1', { sessionStore, postSync });
    expect(result).toEqual({ synced: 0, skipped: true });
    expect(postSync).not.toHaveBeenCalled();
    expect(sessionStore.markSynced).not.toHaveBeenCalled();
  });

  test('posts unsynced sessions and attempts and marks them synced on success', async () => {
    const sessionStore = {
      getUnsynced: jest.fn(async () => ({ sessions: [sampleSession], attempts: [sampleAttempt] })),
      markSynced: jest.fn(async () => {}),
    };
    const postSync = jest.fn(async () => ({ data: { synced: 1, syncedAttempts: 1 } }));

    const result = await syncChildSessions('child-1', { sessionStore, postSync });
    expect(result).toEqual({ synced: 1, syncedAttempts: 1, skipped: false });
    expect(postSync).toHaveBeenCalledTimes(1);
    expect(sessionStore.markSynced).toHaveBeenCalledWith('child-1', ['s-1']);
  });

  test('retries with exponential backoff on network errors and never deletes unsynced data', async () => {
    const sessionStore = {
      getUnsynced: jest.fn(async () => ({ sessions: [sampleSession], attempts: [] })),
      markSynced: jest.fn(),
    };
    const postSync = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: { synced: 1, syncedAttempts: 0 } });
    const sleep = jest.fn(async () => {});

    const result = await syncWithRetry(['child-1'], {
      sessionStore,
      postSync,
      sleep,
      baseDelayMs: 500,
      maxRetries: 3,
      sessionsOnly: true,
    });

    expect(result).toEqual({ synced: 1 });
    expect(sleep).toHaveBeenNthCalledWith(1, 500);
    expect(sleep).toHaveBeenNthCalledWith(2, 1000);
    expect(sessionStore.markSynced).toHaveBeenCalledWith('child-1', ['s-1']);
  });

  test('logs out immediately on 401 without retrying', async () => {
    const sessionStore = {
      getUnsynced: jest.fn(async () => ({ sessions: [sampleSession], attempts: [] })),
      markSynced: jest.fn(),
    };
    const postSync = jest.fn().mockRejectedValue({ response: { status: 401 } });
    const onUnauthorized = jest.fn();
    const sleep = jest.fn();

    const result = await syncWithRetry(['child-1'], {
      sessionStore,
      postSync,
      sleep,
      onUnauthorized,
      sessionsOnly: true,
    });

    expect(result).toEqual({ synced: 0, unauthorized: true });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(sessionStore.markSynced).not.toHaveBeenCalled();
  });

  test('syncChildOnboarding pushes local consent, goals, and baseline without duplicating unchanged syncs', async () => {
    const consent = { childId: 'c1', audioLocalAllowed: true, cameraAllowed: false, derivedSyncAllowed: true, version: 1, updatedAt: '2026-11-28T10:00:00.000Z' };
    const goals = [{ id: 'g1', type: 'weekly_words', target: 10 }];
    const baseline = { baselineId: 'b1', childId: 'c1', checklistVersion: 'v1', taskIds: ['apple'], responses: [], attempts: 1, baselineScore: 100, status: 'complete', startedAt: '2026-11-28T09:00:00.000Z', completedAt: '2026-11-28T09:05:00.000Z' };

    const api = {
      getChildConsent: jest.fn(),
      saveChildConsent: jest.fn(async () => ({ data: { consent } })),
      getChildGoals: jest.fn(),
      saveChildGoals: jest.fn(async () => ({ data: { goals } })),
      getChildBaselines: jest.fn(),
      saveChildBaseline: jest.fn(async () => ({ data: { baseline } })),
    };

    const deps = {
      consentStore: { loadConsent: async () => consent },
      goalsStore: { getGoals: async () => goals, saveGoals: jest.fn() },
      baselineStore: { loadLastCompleted: async () => baseline, loadInProgress: async () => null, saveBaseline: jest.fn() },
      api,
    };

    const first = await syncChildOnboarding('c1', deps);
    expect(first).toEqual({ syncedOnboarding: true });
    expect(api.saveChildConsent).toHaveBeenCalledTimes(1);
    expect(api.saveChildGoals).toHaveBeenCalledTimes(1);
    expect(api.saveChildBaseline).toHaveBeenCalledTimes(1);

    const second = await syncChildOnboarding('c1', deps);
    expect(second).toEqual({ syncedOnboarding: false });
    expect(api.saveChildConsent).toHaveBeenCalledTimes(1);
  });

  test('syncChildOnboarding restores remote consent, goals, and baseline when phone storage is empty', async () => {
    const remoteConsent = { childId: 'c2', audioLocalAllowed: true, cameraAllowed: true, derivedSyncAllowed: false, version: 2, updatedAt: '2026-11-28T10:00:00.000Z' };
    const remoteGoals = [{ id: 'g2', type: 'daily_minutes', target: 10 }];
    const remoteBaseline = { baselineId: 'b2', childId: 'c2', checklistVersion: 'v1', taskIds: ['apple'], responses: [], attempts: 1, baselineScore: 80, status: 'complete', startedAt: '2026-11-28T09:00:00.000Z', completedAt: '2026-11-28T09:05:00.000Z' };

    const saveGoals = jest.fn(async () => remoteGoals);
    const saveBaseline = jest.fn(async () => {});
    const addStars = jest.fn(async () => ({ totalStars: 14 }));

    await syncChildOnboarding('c2', {
      consentStore: { loadConsent: async () => null },
      goalsStore: { getGoals: async () => null, saveGoals },
      baselineStore: { loadLastCompleted: async () => null, loadInProgress: async () => null, saveBaseline },
      rewardStore: { getRewards: async () => ({ totalStars: 0 }), addStars },
      api: {
        getChildConsent: async () => ({ data: { consent: remoteConsent } }),
        saveChildConsent: jest.fn(),
        getChildGoals: async () => ({ data: { goals: remoteGoals } }),
        saveChildGoals: jest.fn(),
        getChildBaselines: async () => ({ data: { latestCompleted: remoteBaseline, inProgress: null } }),
        saveChildBaseline: jest.fn(),
        getChildGameProgress: async () => ({ data: { totalStars: 14 } }),
      },
    });

    expect(JSON.parse(storage['@silent_screen/consent/c2'])).toEqual(remoteConsent);
    expect(saveGoals).toHaveBeenCalledWith('c2', remoteGoals);
    expect(saveBaseline).toHaveBeenCalledWith(remoteBaseline);
    expect(addStars).toHaveBeenCalledWith('c2', 14);
  });
});
