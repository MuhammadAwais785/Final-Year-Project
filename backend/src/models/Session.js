const { getSupabase, throwIfSupabaseError } = require('../config/db');

const ALLOWED_ACTIVITIES = new Set(['object_naming', 'colour_matching', 'sound_imitation']);
const ALLOWED_SESSION_KEYS = new Set([
  'clientId',
  'childId',
  'activity',
  'startedAt',
  'endedAt',
  'stars',
  'practiced',
  'correct',
  'partial'
]);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function toIsoTimestamp(value, fieldName) {
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value || ''));
  if (value === undefined || value === null || Number.isNaN(date.getTime())) {
    throw badRequest(`${fieldName} must be a valid timestamp`);
  }
  return date.toISOString();
}

function toNonNegativeInt(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw badRequest(`${fieldName} must be a non-negative integer`);
  }
  return value;
}

/**
 * Validates one phone session record against the BR-20 strict allowlist.
 * Any unexpected or privacy-sensitive field (e.g. audio, transcript, heard) is rejected.
 */
function validateSessionRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw badRequest('Each session must be an object');
  }

  for (const key of Object.keys(record)) {
    if (!ALLOWED_SESSION_KEYS.has(key)) {
      throw badRequest(`Field '${key}' is not allowed in session sync payload (BR-20)`);
    }
  }

  const clientId = String(record.clientId || '').trim();
  const childId = String(record.childId || '').trim();
  if (!clientId) throw badRequest('Session clientId is required');
  if (!childId) throw badRequest('Session childId is required');
  if (!ALLOWED_ACTIVITIES.has(record.activity)) {
    throw badRequest('Session activity must be a valid game activity');
  }
  if (typeof record.partial !== 'boolean') {
    throw badRequest('Session partial must be a boolean');
  }

  return {
    client_id: clientId,
    child_id: childId,
    activity: record.activity,
    started_at: toIsoTimestamp(record.startedAt, 'startedAt'),
    ended_at: toIsoTimestamp(record.endedAt, 'endedAt'),
    stars: toNonNegativeInt(record.stars, 'stars'),
    practiced: toNonNegativeInt(record.practiced, 'practiced'),
    correct: toNonNegativeInt(record.correct, 'correct'),
    partial: record.partial
  };
}

/**
 * Maps a sessions database row to the phone/API record shape.
 */
function toResponse(row) {
  return {
    id: row.id,
    _id: row.id,
    guardian: row.guardian_id,
    clientId: row.client_id,
    childId: row.child_id,
    activity: row.activity,
    startedAt: Date.parse(row.started_at),
    endedAt: Date.parse(row.ended_at),
    stars: row.stars,
    practiced: row.practiced,
    correct: row.correct,
    partial: row.partial,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Validates all sessions, deduplicates by clientId within the batch, and prepares DB rows.
 */
function prepareSessions(guardianId, records) {
  if (records === undefined) return [];
  if (!Array.isArray(records)) throw badRequest('sessions must be an array');

  const byClientId = new Map();
  for (const record of records) {
    const normalized = validateSessionRecord(record);
    if (!byClientId.has(normalized.client_id)) {
      byClientId.set(normalized.client_id, { guardian_id: guardianId, ...normalized });
    }
  }
  return Array.from(byClientId.values());
}

/**
 * Inserts sessions that have not yet been synced for this guardian (idempotent on clientId).
 */
async function upsertMissing(guardianId, preparedRows) {
  if (!preparedRows || preparedRows.length === 0) return 0;

  const { data, error } = await getSupabase()
    .from('sessions')
    .upsert(preparedRows, {
      onConflict: 'guardian_id,client_id',
      ignoreDuplicates: true
    })
    .select('id');

  throwIfSupabaseError(error);
  return (data || []).length;
}

/**
 * Fetches recent learning sessions for a guardian (optionally filtered to one child).
 */
async function findRecentByGuardian(guardianId, { childId, limit = 100 } = {}) {
  let query = getSupabase()
    .from('sessions')
    .select('*')
    .eq('guardian_id', guardianId);

  if (childId) {
    query = query.eq('child_id', childId);
  }

  const { data, error } = await query
    .order('ended_at', { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return (data || []).map(toResponse);
}

async function findExistingClientIds(guardianId, clientIds) {
  if (!clientIds || clientIds.length === 0) return new Set();
  const { data, error } = await getSupabase()
    .from('sessions')
    .select('client_id')
    .eq('guardian_id', guardianId)
    .in('client_id', clientIds);

  throwIfSupabaseError(error);
  return new Set((data || []).map((row) => row.client_id));
}

module.exports = {
  ALLOWED_ACTIVITIES,
  ALLOWED_SESSION_KEYS,
  validateSessionRecord,
  prepareSessions,
  upsertMissing,
  findRecentByGuardian,
  findExistingClientIds,
  toResponse
};
