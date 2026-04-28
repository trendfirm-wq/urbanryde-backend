const express = require('express');

const {
  createTrip,
  getAllTrips,
  getSingleTrip,
  updateTripStatus,
  getDriverTrips,
} = require('../controllers/tripController');

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, allowRoles('admin'), createTrip);

router.get('/', getAllTrips);
router.get('/driver-trips', protect, allowRoles('driver', 'admin'), getDriverTrips);
router.get('/:id', getSingleTrip);

router.patch('/:id/status', protect, allowRoles('driver', 'admin'), updateTripStatus);

module.exports = router;