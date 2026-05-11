const express = require('express');

const {
  getTripLocation,
  stopTripTracking,
} = require('../controllers/trackingController');

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/trip/:tripId', protect, getTripLocation);

router.patch(
  '/trip/:tripId/stop',
  protect,
  allowRoles('driver', 'admin'),
  stopTripTracking
);

module.exports = router;