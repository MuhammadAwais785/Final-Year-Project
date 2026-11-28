const router = require('express').Router();
const Baseline = require('../models/Baseline');
const ChildGoal = require('../models/ChildGoal');
const ChildProfile = require('../models/ChildProfile');
const ConsentRecord = require('../models/ConsentRecord');
const { requireAuth } = require('../middleware/auth');

async function requireOwnedChild(req, res, next) {
  const child = await ChildProfile.findByIdForGuardian(req.params.id, req.guardianId);
  if (!child) return res.status(404).json({ message: 'Child profile not found' });
  req.childProfile = child;
  return next();
}

router.get('/', requireAuth, async (req, res) => {
  const profiles = await ChildProfile.findByGuardian(req.guardianId);
  res.json(profiles);
});

router.post('/', requireAuth, async (req, res) => {
  const profile = await ChildProfile.create({
    guardianId: req.guardianId,
    name: req.body.name,
    age: req.body.age,
    language: req.body.language
  });
  res.status(201).json(profile);
});

async function updateProfile(req, res) {
  const updated = await ChildProfile.updateForGuardian(req.params.id, req.guardianId, req.body);
  if (!updated) return res.status(404).json({ message: 'Child profile not found' });
  return res.json(updated);
}

router.put('/:id', requireAuth, updateProfile);
router.patch('/:id', requireAuth, updateProfile);

router.delete('/:id', requireAuth, async (req, res) => {
  const deleted = await ChildProfile.removeForGuardian(req.params.id, req.guardianId);
  if (!deleted) return res.status(404).json({ message: 'Child profile not found' });
  return res.json(deleted);
});

router.get('/:id/consent', requireAuth, requireOwnedChild, async (req, res) => {
  const [consent, history] = await Promise.all([
    ConsentRecord.findLatestByChild(req.guardianId, req.params.id),
    ConsentRecord.findHistoryByChild(req.guardianId, req.params.id)
  ]);
  res.json({ consent, history });
});

router.post('/:id/consent', requireAuth, requireOwnedChild, async (req, res) => {
  const consent = await ConsentRecord.saveForChild(req.guardianId, req.params.id, req.body);
  res.status(201).json({ consent });
});

router.get('/:id/goals', requireAuth, requireOwnedChild, async (req, res) => {
  const goals = await ChildGoal.findByChild(req.guardianId, req.params.id);
  res.json({ goals });
});

router.put('/:id/goals', requireAuth, requireOwnedChild, async (req, res) => {
  const goals = await ChildGoal.replaceForChild(req.guardianId, req.params.id, req.body?.goals);
  res.json({ goals });
});

router.get('/:id/baselines', requireAuth, requireOwnedChild, async (req, res) => {
  const data = await Baseline.findByChild(req.guardianId, req.params.id);
  res.json(data);
});

router.post('/:id/baselines', requireAuth, requireOwnedChild, async (req, res) => {
  const baseline = await Baseline.saveForChild(req.guardianId, req.params.id, req.body);
  res.status(201).json({ baseline });
});

module.exports = router;
