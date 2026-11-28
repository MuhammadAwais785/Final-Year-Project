const { getSupabase, throwIfSupabaseError } = require('../config/db');

const ALLOWED_KEYS = new Set([
  'childId',
  'audioLocalAllowed',
  'cameraAllowed',
  'derivedSyncAllowed',
  'version',
  'updatedAt'
]);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function validateConsentInput(input, expectedChildId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Consent payload must be an object');
  }

  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw badRequest(`Field '${key}' is not allowed in consent payload`);
    }
  }

  if (input.childId !== undefined && String(input.childId) !== String(expectedChildId)) {
    throw badRequest('Consent childId does not match route child');
  }

  if (typeof input.audioLocalAllowed !== 'boolean') {
    throw badRequest('audioLocalAllowed must be a boolean');
  }
  if (typeof input.cameraAllowed !== 'boolean') {
    throw badRequest('cameraAllowed must be a boolean');
  }
  const derivedSyncAllowed = input.derivedSyncAllowed === undefined ? false : input.derivedSyncAllowed;
  if (typeof derivedSyncAllowed !== 'boolean') {
    throw badRequest('derivedSyncAllowed must be a boolean');
  }

  let updatedAt = new Date().toISOString();
  if (input.updatedAt !== undefined) {
    const parsed = new Date(input.updatedAt);
    if (Number.isNaN(parsed.getTime())) {
      throw badRequest('updatedAt must be a valid timestamp');
    }
    updatedAt = parsed.toISOString();
  }

  let version = null;
  if (input.version !== undefined) {
    if (!Number.isInteger(input.version) || input.version < 1) {
      throw badRequest('version must be a positive integer');
    }
    version = input.version;
  }

  return {
    audio_local_allowed: input.audioLocalAllowed,
    camera_allowed: input.cameraAllowed,
    derived_sync_allowed: derivedSyncAllowed,
    version,
    updated_at: updatedAt
  };
}

function toResponse(row) {
  return {
    id: row.id,
    childId: row.child_id,
    audioLocalAllowed: row.audio_local_allowed,
    cameraAllowed: row.camera_allowed,
    derivedSyncAllowed: row.derived_sync_allowed,
    version: row.version,
    updatedAt: row.updated_at
  };
}

async function findLatestByChild(guardianId, childId) {
  const { data, error } = await getSupabase()
    .from('consent_records')
    .select('*')
    .eq('guardian_id', guardianId)
    .eq('child_id', childId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toResponse(data) : null;
}

async function findHistoryByChild(guardianId, childId) {
  const { data, error } = await getSupabase()
    .from('consent_records')
    .select('*')
    .eq('guardian_id', guardianId)
    .eq('child_id', childId)
    .order('version', { ascending: false });

  throwIfSupabaseError(error);
  return (data || []).map(toResponse);
}

/**
 * Saves a versioned consent record for a child (FR-10, FR-16, BR-24).
 * Re-sending an already-stored version is idempotent for offline sync retries.
 */
async function saveForChild(guardianId, childId, input) {
  const fields = validateConsentInput(input, childId);
  const latest = await findLatestByChild(guardianId, childId);

  if (fields.version !== null && latest && fields.version <= latest.version) {
    const { data: existing, error: lookupError } = await getSupabase()
      .from('consent_records')
      .select('*')
      .eq('guardian_id', guardianId)
      .eq('child_id', childId)
      .eq('version', fields.version)
      .maybeSingle();

    throwIfSupabaseError(lookupError);
    if (existing) return toResponse(existing);
  }

  const nextVersion = fields.version !== null && (!latest || fields.version > latest.version)
    ? fields.version
    : (latest?.version || 0) + 1;

  const { data, error } = await getSupabase()
    .from('consent_records')
    .insert({
      guardian_id: guardianId,
      child_id: childId,
      audio_local_allowed: fields.audio_local_allowed,
      camera_allowed: fields.camera_allowed,
      derived_sync_allowed: fields.derived_sync_allowed,
      version: nextVersion,
      updated_at: fields.updated_at
    })
    .select('*')
    .single();

  throwIfSupabaseError(error);
  return toResponse(data);
}

module.exports = {
  findLatestByChild,
  findHistoryByChild,
  saveForChild,
  toResponse
};
