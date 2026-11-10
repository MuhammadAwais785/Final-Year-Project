const router = require('express').Router();
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const sessions = await Session.find({ guardian: req.guardianId }).sort({ createdAt: -1 }).limit(100);
  res.json({ sessions });
});
module.exports = router;
