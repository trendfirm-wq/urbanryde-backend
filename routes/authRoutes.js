const express = require('express');

const {
  register,
  login,
  me,
  createDriver,
  getAllDrivers,
  verifyPhoneOtp,
  resendPhoneOtp,
} = require('../controllers/authController');

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-phone', verifyPhoneOtp);
router.post('/resend-otp', resendPhoneOtp);

router.get('/me', protect, me);

router.post('/create-driver', protect, allowRoles('admin'), createDriver);
router.get('/drivers', protect, allowRoles('admin'), getAllDrivers);

module.exports = router;