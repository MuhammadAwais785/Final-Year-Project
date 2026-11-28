const router = require('express').Router();
const { CONTENT_VERSION, getGameContent, listActivities } = require('../data/gameCatalog');
const Attempt = require('../models/Attempt');
const ChildProfile = require('../models/ChildProfile');
const GameProgress = require('../models/GameProgress');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

async function requireOwnedChild(req, res, next) {
  const child = await ChildProfile.findByIdForGuardian(req.params.childId, req.guardianId);
  if (!child) return res.status(404).json({ message: 'Child profile not found' });
  req.childProfile = child;
  return next();
}

router.get('/activities', requireAuth, (req, res) => {
  res.json({ version: CONTENT_VERSION, activities: listActivities() });
});

router.get('/content', requireAuth, (req, res) => {
  const activity = req.query.activity ? String(req.query.activity) : undefined;
  const level = req.query.level !== undefined ? req.query.level : undefined;
  res.json(getGameContent({ activity, level }));
});

router.get('/progress/:childId', requireAuth, requireOwnedChild, async (req, res) => {
  const progress = await GameProgress.getProgressForChild(req.guardianId, req.params.childId);
  res.json(progress);
});

router.get('/sessions/:childId', requireAuth, requireOwnedChild, async (req, res) => {
  const activity = req.query.activity ? String(req.query.activity) : undefined;
  if (activity && !Session.ALLOWED_ACTIVITIES.has(activity)) {
    throw badRequest('Unknown game activity');
  }

  let limit = 50;
  if (req.query.limit !== undefined) {
    const parsed = Number(req.query.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      throw badRequest('limit must be an integer between 1 and 200');
    }
    limit = parsed;
  }

  const allSessions = await Session.findRecentByGuardian(req.guardianId, {
    childId: req.params.childId,
    limit: activity ? 200 : limit
  });
  const sessions = activity
    ? allSessions.filter((s) => s.activity === activity).slice(0, limit)
    : allSessions;

  res.json({ sessions });
});

/**
 * Direct single-round game submission reusing the same strict BR-20 allowlist as /api/sync.
 */
router.post('/sessions', requireAuth, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Game session payload must be an object');
  }

  const allowedTopKeys = new Set(['session', 'attempts']);
  for (const key of Object.keys(body)) {
    if (!allowedTopKeys.has(key)) {
      throw badRequest(`Field '${key}' is not allowed in game session payload (BR-20)`);
    }
  }
  if (!body.session || typeof body.session !== 'object' || Array.isArray(body.session)) {
    throw badRequest('session object is required');
  }

  const sessionRows = Session.prepareSessions(req.guardianId, [body.session]);
  const child = await ChildProfile.findByIdForGuardian(sessionRows[0].child_id, req.guardianId);
  if (!child) {
    throw badRequest('Session references an unknown child profile');
  }

  const attemptRows = Attempt.prepareAttempts(req.guardianId, body.attempts);
  for (const row of attemptRows) {
    if (row.session_client_id !== sessionRows[0].client_id) {
      throw badRequest('Attempt sessionClientId must match session clientId');
    }
  }

  const synced = await Session.upsertMissing(req.guardianId, sessionRows);
  const syncedAttempts = await Attempt.upsertMissing(req.guardianId, attemptRows);
  res.status(201).json({ synced, syncedAttempts });
});

module.exports = router;
