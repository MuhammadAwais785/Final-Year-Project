const router = require('express').Router();
const {
  register,
  login,
  me,
  updateMe,
  changePassword,
  deleteMe,
  setPin,
  verifyPin
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts, please try again later'
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.delete('/me', requireAuth, authLimiter, deleteMe);
router.post('/change-password', requireAuth, authLimiter, changePassword);
router.put('/pin', requireAuth, authLimiter, setPin);
router.post('/pin/verify', requireAuth, authLimiter, verifyPin);

module.exports = router;
module.exports.authLimiter = authLimiter;
