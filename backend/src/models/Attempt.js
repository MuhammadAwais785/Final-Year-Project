const { getSupabase, throwIfSupabaseError } = require('../config/db');

const ALLOWED_STATUSES = new Set(['recognized', 'incorrect', 'inconclusive', 'no_response']);
const ALLOWED_ATTEMPT_KEYS = new Set([
  'sessionClientId',
  'promptId',
  'status',
  'score',
  'hintLevel',
  'at'
]);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function toIsoTimestamp(value) {
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value || ''));
  if (value === undefined || value === null || Number.isNaN(date.getTime())) {
    throw badRequest('Attempt at must be a valid timestamp');
  }
  return date.toISOString();
}

/**
 * Validates one attempt record against the BR-20 strict allowlist.
 * Never accepts audio, heard words, or transcripts.
 */
function validateAttemptRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw badRequest('Each attempt must be an object');
  }

  for (const key of Object.keys(record)) {
    if (!ALLOWED_ATTEMPT_KEYS.has(key)) {
      throw badRequest(`Field '${key}' is not allowed in attempt sync payload (BR-20)`);
    }
  }

  const sessionClientId = String(record.sessionClientId || '').trim();
  const promptId = String(record.promptId || '').trim();
  if (!sessionClientId) throw badRequest('Attempt sessionClientId is required');
  if (!promptId) throw badRequest('Attempt promptId is required');
  if (!ALLOWED_STATUSES.has(record.status)) {
    throw badRequest('Attempt status is invalid');
  }

  let score = null;
  if (record.score !== null && record.score !== undefined) {
    const parsedScore = Number(record.score);
    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      throw badRequest('Attempt score must be between 0 and 100');
    }
    score = parsedScore;
  }

  if (!Number.isInteger(record.hintLevel) || record.hintLevel < 0) {
    throw badRequest('Attempt hintLevel must be a non-negative integer');
  }

  return {
    session_client_id: sessionClientId,
    prompt_id: promptId,
    status: record.status,
    score,
    hint_level: record.hintLevel,
    at: toIsoTimestamp(record.at)
  };
}

function toResponse(row) {
  return {
    id: row.id,
    _id: row.id,
    guardian: row.guardian_id,
    sessionClientId: row.session_client_id,
    promptId: row.prompt_id,
    status: row.status,
    score: row.score,
    hintLevel: row.hint_level,
    at: Date.parse(row.at),
    createdAt: row.created_at
  };
}

function prepareAttempts(guardianId, records) {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw badRequest('attempts must be an array');

  const unique = new Map();
  for (const record of records) {
    const normalized = validateAttemptRecord(record);
    const key = `${normalized.session_client_id}::${normalized.prompt_id}::${normalized.at}`;
    if (!unique.has(key)) {
      unique.set(key, { guardian_id: guardianId, ...normalized });
    }
  }
  return Array.from(unique.values());
}

async function upsertMissing(guardianId, preparedRows) {
  if (!preparedRows || preparedRows.length === 0) return 0;

  const { data, error } = await getSupabase()
    .from('attempts')
    .upsert(preparedRows, {
      onConflict: 'guardian_id,session_client_id,prompt_id,at',
      ignoreDuplicates: true
    })
    .select('id');

  throwIfSupabaseError(error);
  return (data || []).length;
}

async function findByGuardianSessions(guardianId, sessionClientIds) {
  if (!sessionClientIds || sessionClientIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from('attempts')
    .select('*')
    .eq('guardian_id', guardianId)
    .in('session_client_id', sessionClientIds)
    .order('at', { ascending: true });

  throwIfSupabaseError(error);
  return (data || []).map(toResponse);
}

module.exports = {
  ALLOWED_STATUSES,
  ALLOWED_ATTEMPT_KEYS,
  validateAttemptRecord,
  prepareAttempts,
  upsertMissing,
  findByGuardianSessions,
  toResponse
};
