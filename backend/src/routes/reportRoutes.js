const router = require('express').Router();
const Attempt = require('../models/Attempt');
const ChildProfile = require('../models/ChildProfile');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const childId = req.query.childId ? String(req.query.childId) : undefined;
  if (childId) {
    const child = await ChildProfile.findByIdForGuardian(childId, req.guardianId);
    if (!child) return res.status(404).json({ message: 'Child profile not found' });
  }

  const sessions = await Session.findRecentByGuardian(req.guardianId, { childId });
  const attempts = await Attempt.findByGuardianSessions(
    req.guardianId,
    sessions.map((s) => s.clientId)
  );

  return res.json({ sessions, attempts });
});

module.exports = router;
