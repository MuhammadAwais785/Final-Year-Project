const { getSupabase, throwIfSupabaseError } = require('../config/db');

function toPublicGuardian(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    language: row.language,
    hasPin: Boolean(row.pin_hash)
  };
}

/**
 * Finds a guardian account by normalized email address (includes hashes for auth checks).
 */
async function findByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await getSupabase()
    .from('guardians')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data;
}

/**
 * Finds a guardian row by id including password_hash and pin_hash (server-internal only).
 */
async function findByIdWithSecrets(id) {
  if (!id) return null;

  const { data, error } = await getSupabase()
    .from('guardians')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data;
}

/**
 * Finds a guardian's public profile by id (never exposes password_hash or pin_hash).
 */
async function findById(id) {
  if (!id) return null;

  const { data, error } = await getSupabase()
    .from('guardians')
    .select('id, name, email, language, pin_hash, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toPublicGuardian(data) : null;
}

/**
 * Inserts a new guardian record and returns the public guardian shape.
 */
async function create({ name, email, passwordHash, language }) {
  const { data, error } = await getSupabase()
    .from('guardians')
    .insert({
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password_hash: passwordHash,
      language: language || 'en'
    })
    .select('id, name, email, language, pin_hash, created_at, updated_at')
    .single();

  throwIfSupabaseError(error);
  return toPublicGuardian(data);
}

/**
 * Updates allowed guardian profile fields (name and/or language).
 */
async function updateProfile(id, updates) {
  const { data, error } = await getSupabase()
    .from('guardians')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, email, language, pin_hash, created_at, updated_at')
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toPublicGuardian(data) : null;
}

/**
 * Updates a guardian's password hash.
 */
async function setPasswordHash(id, passwordHash) {
  const { data, error } = await getSupabase()
    .from('guardians')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  throwIfSupabaseError(error);
  return Boolean(data);
}

/**
 * Updates a guardian's hashed parent PIN.
 */
async function setPinHash(id, pinHash) {
  const { data, error } = await getSupabase()
    .from('guardians')
    .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, email, language, pin_hash, created_at, updated_at')
    .maybeSingle();

  throwIfSupabaseError(error);
  return data ? toPublicGuardian(data) : null;
}

/**
 * Permanently deletes a guardian account (cascading to child profiles, sessions, etc.).
 */
async function removeById(id) {
  const { data, error } = await getSupabase()
    .from('guardians')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  throwIfSupabaseError(error);
  return Boolean(data);
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithSecrets,
  create,
  updateProfile,
  setPasswordHash,
  setPinHash,
  removeById,
  toPublicGuardian
};
