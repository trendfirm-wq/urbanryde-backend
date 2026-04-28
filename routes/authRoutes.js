const express = require('express');

const {
  register,
  login,
  me,
  createDriver,
  getAllDrivers,
} = require('../controllers/authController');

const {
  protect,
  allowRoles,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, me);

// 🔥 ADMIN ROUTES
router.post('/create-driver', protect, allowRoles('admin'), createDriver);
router.get('/drivers', protect, allowRoles('admin'), getAllDrivers);

module.exports = router;