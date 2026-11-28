const { getSupabase, throwIfSupabaseError } = require('../config/db');

const MIN_AGE = 3;
const MAX_AGE = 7;
const MAX_NAME_LENGTH = 30;
const LANGUAGES = new Set(['en', 'ur']);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Validates and normalizes child profile fields against BR-1 (age 3-7) and UI-8 (en/ur).
 */
function validateProfileFields({ name, age, language }, { partial = false } = {}) {
  const payload = {};

  if (!partial || name !== undefined) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw badRequest('Child name is required');
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw badRequest(`Child name must be ${MAX_NAME_LENGTH} characters or fewer`);
    }
    payload.name = trimmed;
  }

  if (!partial || age !== undefined) {
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
      throw badRequest(`Child age must be an integer between ${MIN_AGE} and ${MAX_AGE} (BR-1)`);
    }
    payload.age = parsedAge;
  }

  if (!partial || language !== undefined) {
    const lang = language === undefined ? 'en' : language;
    if (!LANGUAGES.has(lang)) {
      throw badRequest("Language must be 'en' or 'ur'");
    }
    payload.language = lang;
  }

  return payload;
}

/**
 * Maps a child_profiles database row to the API response shape expected by the app.
 */
function toResponse(row) {
  return {
    id: row.id,
    _id: row.id,
    guardian: row.guardian_id,
    name: row.name,
    age: row.age,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findByGuardian(guardianId) {
  const { data, error } = await getSupabase()
    .from('child_profiles')
    .select('*')
    .eq('guardian_id', guardianId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error);
  return (data || []).map(toResponse);
}

async function findByIdForGuardian(id, guardianId) {
  const { data, error } = await getSupabase()
    .from('child_profiles')
    .select('*')
    .eq('id', id)
    .eq('guardian_id', guardianId)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toResponse(data) : null;
}

async function create({ guardianId, name, age, language }) {
  const fields = validateProfileFields({ name, age, language });
  const { data, error } = await getSupabase()
    .from('child_profiles')
    .insert({ guardian_id: guardianId, ...fields })
    .select('*')
    .single();

  throwIfSupabaseError(error);
  return toResponse(data);
}

async function updateForGuardian(id, guardianId, updates) {
  const fields = validateProfileFields(updates || {}, { partial: true });
  if (Object.keys(fields).length === 0) {
    throw badRequest('At least one profile field (name, age, language) is required');
  }

  const { data, error } = await getSupabase()
    .from('child_profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('guardian_id', guardianId)
    .select('*')
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toResponse(data) : null;
}

async function removeForGuardian(id, guardianId) {
  const { data, error } = await getSupabase()
    .from('child_profiles')
    .delete()
    .eq('id', id)
    .eq('guardian_id', guardianId)
    .select('id')
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? { id: data.id, deleted: true } : null;
}

module.exports = {
  MIN_AGE,
  MAX_AGE,
  findByGuardian,
  findByIdForGuardian,
  create,
  updateForGuardian,
  removeForGuardian,
  toResponse
};
