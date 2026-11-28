import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChildGameProgress } from '../../api/games';
import {
  getChildBaselines,
  getChildConsent,
  getChildGoals,
  saveChildBaseline,
  saveChildConsent,
  saveChildGoals,
} from '../../api/profiles';
import { syncData } from '../../api/sync';
import * as defaultBaselineStore from '../m01_onboarding/baselineStore';
import * as defaultConsentStore from '../m01_onboarding/consentStore';
import * as defaultGoalsStore from '../m01_onboarding/goalsStore';
import * as defaultRewardStore from '../m03_games/rewardStore';
import * as defaultSessionStore from '../m03_games/sessionStore';

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const onboardingMetaKey = (childId) => `@silent_screen/onboarding_sync_meta/${childId}`;

async function readSyncMeta(childId) {
  try {
    const raw = await AsyncStorage.getItem(onboardingMetaKey(childId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeSyncMeta(childId, meta) {
  try {
    await AsyncStorage.setItem(onboardingMetaKey(childId), JSON.stringify(meta));
  } catch {
    // Non-fatal metadata cache failure
  }
}

/**
 * Strips local-only fields (such as `synced`) so the payload strictly matches
 * the backend BR-20 allowlist (no audio, no transcripts, no unexpected keys).
 */
export function toSyncPayload({ sessions = [], attempts = [] }) {
  return {
    sessions: sessions.map((s) => ({
      clientId: s.clientId,
      childId: s.childId,
      activity: s.activity,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      stars: s.stars,
      practiced: s.practiced,
      correct: s.correct,
      partial: Boolean(s.partial),
    })),
    attempts: attempts.map((a) => ({
      sessionClientId: a.sessionClientId,
      promptId: a.promptId,
      status: a.status,
      score: a.score ?? null,
      hintLevel: a.hintLevel ?? 0,
      at: a.at,
    })),
  };
}

/**
 * Syncs unsynced sessions and attempts for one child.
 * Local records are never deleted if the network request fails.
 */
export async function syncChildSessions(
  childId,
  { sessionStore = defaultSessionStore, postSync = syncData } = {},
) {
  if (!childId) return { synced: 0, skipped: true };

  const unsynced = await sessionStore.getUnsynced(childId);
  if (!unsynced.sessions.length && !unsynced.attempts.length) {
    return { synced: 0, skipped: true };
  }

  const payload = toSyncPayload(unsynced);
  const response = await postSync(payload);
  const clientIds = unsynced.sessions.map((s) => s.clientId);
  await sessionStore.markSynced(childId, clientIds);

  return {
    synced: response?.data?.synced ?? clientIds.length,
    syncedAttempts: response?.data?.syncedAttempts ?? payload.attempts.length,
    skipped: false,
  };
}

/**
 * Bidirectional sync for child consent, goals, and baseline records (M-08).
 * Pushes local changes to backend and restores remote data when local phone storage is empty.
 */
export async function syncChildOnboarding(
  childId,
  {
    consentStore = defaultConsentStore,
    goalsStore = defaultGoalsStore,
    baselineStore = defaultBaselineStore,
    rewardStore = defaultRewardStore,
    api = {
      getChildConsent,
      saveChildConsent,
      getChildGoals,
      saveChildGoals,
      getChildBaselines,
      saveChildBaseline,
      getChildGameProgress,
    },
  } = {},
) {
  if (!childId) return { syncedOnboarding: false };

  const meta = await readSyncMeta(childId);
  const nextMeta = { ...meta };
  let updated = false;

  // 1. Consent
  const localConsent = await consentStore.loadConsent(childId);
  if (localConsent) {
    const fingerprint = `${localConsent.version}:${localConsent.updatedAt}`;
    if (meta.consentFingerprint !== fingerprint) {
      await api.saveChildConsent(childId, localConsent);
      nextMeta.consentFingerprint = fingerprint;
      updated = true;
    }
  } else {
    const res = await api.getChildConsent(childId);
    const remote = res?.data?.consent;
    if (remote && typeof remote.audioLocalAllowed === 'boolean') {
      await AsyncStorage.setItem(`@silent_screen/consent/${childId}`, JSON.stringify(remote));
      nextMeta.consentFingerprint = `${remote.version}:${remote.updatedAt}`;
    }
  }

  // 2. Goals
  const localGoals = await goalsStore.getGoals(childId);
  if (localGoals && localGoals.length > 0) {
    const fingerprint = JSON.stringify(localGoals);
    if (meta.goalsFingerprint !== fingerprint) {
      await api.saveChildGoals(childId, localGoals);
      nextMeta.goalsFingerprint = fingerprint;
      updated = true;
    }
  } else {
    const res = await api.getChildGoals(childId);
    const remoteGoals = res?.data?.goals;
    if (Array.isArray(remoteGoals) && remoteGoals.length > 0) {
      await goalsStore.saveGoals(childId, remoteGoals);
      nextMeta.goalsFingerprint = JSON.stringify(remoteGoals);
    }
  }

  // 3. Baseline (completed + in-progress)
  const [localCompleted, localInProgress] = await Promise.all([
    baselineStore.loadLastCompleted(childId),
    baselineStore.loadInProgress(childId),
  ]);

  if (localCompleted) {
    const fingerprint = `${localCompleted.baselineId}:${localCompleted.completedAt}`;
    if (meta.completedBaselineFingerprint !== fingerprint) {
      await api.saveChildBaseline(childId, localCompleted);
      nextMeta.completedBaselineFingerprint = fingerprint;
      updated = true;
    }
  }

  if (localInProgress) {
    const fingerprint = `${localInProgress.baselineId}:${localInProgress.responses?.length || 0}:${localInProgress.attempts}`;
    if (meta.inProgressBaselineFingerprint !== fingerprint) {
      await api.saveChildBaseline(childId, localInProgress);
      nextMeta.inProgressBaselineFingerprint = fingerprint;
      updated = true;
    }
  }

  if (!localCompleted && !localInProgress) {
    const res = await api.getChildBaselines(childId);
    const remoteCompleted = res?.data?.latestCompleted;
    const remoteInProgress = res?.data?.inProgress;
    if (remoteCompleted?.status === 'complete') {
      await baselineStore.saveBaseline(remoteCompleted);
      nextMeta.completedBaselineFingerprint = `${remoteCompleted.baselineId}:${remoteCompleted.completedAt}`;
    }
    if (remoteInProgress?.status === 'incomplete') {
      await baselineStore.saveBaseline(remoteInProgress);
      nextMeta.inProgressBaselineFingerprint = `${remoteInProgress.baselineId}:${remoteInProgress.responses?.length || 0}:${remoteInProgress.attempts}`;
    }
  }

  // 4. Restore earned stars on a fresh device (BR-28: stars are never lost).
  if (!meta.rewardsRestored && rewardStore?.getRewards && api.getChildGameProgress) {
    const localRewards = await rewardStore.getRewards(childId);
    if ((localRewards?.totalStars || 0) === 0) {
      const progressRes = await api.getChildGameProgress(childId);
      const serverStars = progressRes?.data?.totalStars || 0;
      if (serverStars > 0) {
        await rewardStore.addStars(childId, serverStars);
      }
      if (progressRes?.data && typeof progressRes.data.totalStars === 'number') {
        nextMeta.rewardsRestored = true;
      }
    } else {
      nextMeta.rewardsRestored = true;
    }
  }

  await writeSyncMeta(childId, nextMeta);
  return { syncedOnboarding: updated };
}

/**
 * Syncs unsynced sessions and onboarding records for all provided child ids.
 */
export async function syncAllChildren(childIds, deps = {}) {
  const ids = Array.from(new Set((childIds || []).filter(Boolean)));
  let totalSynced = 0;
  for (const childId of ids) {
    const result = await syncChildSessions(childId, deps);
    totalSynced += result.synced || 0;
    if (!deps.sessionsOnly) {
      await syncChildOnboarding(childId, deps.onboardingDeps);
    }
  }
  return { synced: totalSynced };
}

let activeSync = null;

/**
 * Runs sync with exponential backoff on transient failures.
 * Stops immediately on 401 (invoking `onUnauthorized`) or 400 validation errors.
 */
export async function syncWithRetry(
  childIds,
  {
    maxRetries = 3,
    baseDelayMs = 1000,
    sleep = defaultSleep,
    onUnauthorized,
    ...deps
  } = {},
) {
  if (activeSync) return activeSync;

  const task = (async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await syncAllChildren(childIds, deps);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          onUnauthorized?.();
          return { synced: 0, unauthorized: true };
        }
        if (status === 400 || attempt === maxRetries) {
          return { synced: 0, failed: true, error };
        }
        await sleep(baseDelayMs * (2 ** attempt));
      }
    }
    return { synced: 0, failed: true };
  })();

  activeSync = task;
  try {
    return await task;
  } finally {
    if (activeSync === task) activeSync = null;
  }
}
