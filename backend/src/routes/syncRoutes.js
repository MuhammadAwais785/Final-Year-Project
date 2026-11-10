const router = require('express').Router();
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const records = Array.isArray(req.body.records) ? req.body.records : [];
  const payload = records.map((record) => ({ ...record, guardian: req.guardianId }));
  const results = await Promise.all(payload.map((record) => Session.updateOne(
    { guardian: req.guardianId, clientId: record.clientId },
    { $setOnInsert: record },
    { upsert: true }
  )));
  res.json({ synced: results.filter((result) => result.upsertedCount).length });
});

module.exports = router;
