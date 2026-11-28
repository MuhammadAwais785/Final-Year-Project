const router = require('express').Router();
const Attempt = require('../models/Attempt');
const ChildProfile = require('../models/ChildProfile');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

const ALLOWED_BODY_KEYS = new Set(['sessions', 'attempts']);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

router.post('/', requireAuth, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Sync payload must be an object with sessions and attempts');
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      throw badRequest(`Field '${key}' is not allowed in sync payload (BR-20)`);
    }
  }

  const sessionRows = Session.prepareSessions(req.guardianId, body.sessions);
  const attemptRows = Attempt.prepareAttempts(req.guardianId, body.attempts);

  if (sessionRows.length > 0) {
    const ownedProfiles = await ChildProfile.findByGuardian(req.guardianId);
    const ownedIds = new Set(ownedProfiles.map((p) => p.id));
    for (const row of sessionRows) {
      if (!ownedIds.has(row.child_id)) {
        throw badRequest('Session references an unknown child profile');
      }
    }
  }

  if (attemptRows.length > 0) {
    const batchSessionIds = new Set(sessionRows.map((s) => s.client_id));
    const missingFromBatch = Array.from(new Set(
      attemptRows.map((a) => a.session_client_id).filter((id) => !batchSessionIds.has(id))
    ));
    const existingIds = await Session.findExistingClientIds(req.guardianId, missingFromBatch);
    for (const id of missingFromBatch) {
      if (!existingIds.has(id)) {
        throw badRequest(`Attempt references unknown session '${id}'`);
      }
    }
  }

  const synced = await Session.upsertMissing(req.guardianId, sessionRows);
  const syncedAttempts = await Attempt.upsertMissing(req.guardianId, attemptRows);
  res.json({ synced, syncedAttempts });
});

module.exports = router;
