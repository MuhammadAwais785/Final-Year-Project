const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Guardian = require('../models/Guardian');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{4}$/;
const NAME_MAX_LENGTH = 60;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const LANGUAGES = new Set(['en', 'ur']);
const PROFILE_UPDATE_KEYS = new Set(['name', 'language']);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function tokenFor(id) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function normalizeEmail(raw) {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw badRequest('Please provide a valid email address');
  }
  return email;
}

function validatePassword(raw, fieldName = 'Password') {
  if (typeof raw !== 'string' || raw.length < PASSWORD_MIN_LENGTH || raw.length > PASSWORD_MAX_LENGTH) {
    throw badRequest(`${fieldName} must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`);
  }
  return raw;
}

function validatePin(raw, fieldName = 'PIN') {
  if (typeof raw !== 'string' || !PIN_RE.test(raw)) {
    throw badRequest(`${fieldName} must be exactly 4 digits`);
  }
  return raw;
}

async function register(req, res) {
  const { name, email, password, language } = req.body || {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || trimmedName.length > NAME_MAX_LENGTH) {
    throw badRequest(`Name is required and must be ${NAME_MAX_LENGTH} characters or fewer`);
  }

  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);

  const normalizedLang = language === undefined ? 'en' : language;
  if (!LANGUAGES.has(normalizedLang)) {
    throw badRequest("Language must be 'en' or 'ur'");
  }

  const exists = await Guardian.findByEmail(normalizedEmail);
  if (exists) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const guardian = await Guardian.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    language: normalizedLang
  });

  return res.status(201).json({ token: tokenFor(guardian.id), guardian });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (typeof password !== 'string' || password.length === 0) {
    throw badRequest('Password is required');
  }

  const guardian = await Guardian.findByEmail(normalizedEmail);
  if (!guardian || !(await bcrypt.compare(password, guardian.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    token: tokenFor(guardian.id),
    guardian: Guardian.toPublicGuardian(guardian)
  });
}

async function me(req, res) {
  const guardian = await Guardian.findById(req.guardianId);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }
  return res.json({ guardian });
}

/**
 * Updates the guardian's name and/or preferred UI language.
 */
async function updateMe(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Update payload must be an object');
  }

  for (const key of Object.keys(body)) {
    if (!PROFILE_UPDATE_KEYS.has(key)) {
      throw badRequest(`Field '${key}' cannot be updated`);
    }
  }

  const updates = {};
  if (body.name !== undefined) {
    const trimmed = typeof body.name === 'string' ? body.name.trim() : '';
    if (!trimmed || trimmed.length > NAME_MAX_LENGTH) {
      throw badRequest(`Name is required and must be ${NAME_MAX_LENGTH} characters or fewer`);
    }
    updates.name = trimmed;
  }

  if (body.language !== undefined) {
    if (!LANGUAGES.has(body.language)) {
      throw badRequest("Language must be 'en' or 'ur'");
    }
    updates.language = body.language;
  }

  if (Object.keys(updates).length === 0) {
    throw badRequest('At least one field (name or language) is required');
  }

  const guardian = await Guardian.updateProfile(req.guardianId, updates);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }
  return res.json({ guardian });
}

/**
 * Changes the guardian's login password after verifying their current password.
 */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    throw badRequest('Current password is required');
  }
  validatePassword(newPassword, 'New password');

  const guardian = await Guardian.findByIdWithSecrets(req.guardianId);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }

  const matches = await bcrypt.compare(currentPassword, guardian.password_hash);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  const nextHash = await bcrypt.hash(newPassword, 12);
  await Guardian.setPasswordHash(guardian.id, nextHash);
  return res.json({ message: 'Password updated' });
}

/**
 * Permanently deletes the guardian account after password confirmation.
 */
async function deleteMe(req, res) {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    throw badRequest('Password is required to delete your account');
  }

  const guardian = await Guardian.findByIdWithSecrets(req.guardianId);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }

  const matches = await bcrypt.compare(password, guardian.password_hash);
  if (!matches) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  await Guardian.removeById(guardian.id);
  return res.json({ deleted: true });
}

/**
 * Sets or changes the guardian's 4-digit parent PIN (BR-34).
 */
async function setPin(req, res) {
  const { pin, currentPin, password } = req.body || {};
  const validPin = validatePin(pin);

  const guardian = await Guardian.findByIdWithSecrets(req.guardianId);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }

  if (guardian.pin_hash) {
    const verifiedWithPassword = typeof password === 'string' && password.length > 0
      ? await bcrypt.compare(password, guardian.password_hash)
      : false;
    const verifiedWithPin = typeof currentPin === 'string' && PIN_RE.test(currentPin)
      ? await bcrypt.compare(currentPin, guardian.pin_hash)
      : false;

    if (!verifiedWithPassword && !verifiedWithPin) {
      return res.status(401).json({ message: 'Current PIN or account password is required to change your PIN' });
    }
  }

  const pinHash = await bcrypt.hash(validPin, 12);
  const updated = await Guardian.setPinHash(guardian.id, pinHash);
  return res.json({ guardian: updated });
}

/**
 * Verifies a 4-digit parent PIN against the guardian's stored hash (BR-34).
 */
async function verifyPin(req, res) {
  const validPin = validatePin(req.body?.pin);
  const guardian = await Guardian.findByIdWithSecrets(req.guardianId);
  if (!guardian) {
    return res.status(401).json({ message: 'Session is no longer valid' });
  }
  if (!guardian.pin_hash) {
    return res.status(404).json({ message: 'Parent PIN is not set' });
  }

  const matches = await bcrypt.compare(validPin, guardian.pin_hash);
  if (!matches) {
    return res.status(401).json({ valid: false, message: 'Incorrect PIN' });
  }
  return res.json({ valid: true });
}

module.exports = {
  register,
  login,
  me,
  updateMe,
  changePassword,
  deleteMe,
  setPin,
  verifyPin
};
