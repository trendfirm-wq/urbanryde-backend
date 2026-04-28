const express = require('express');

const {
  createBooking,
  getMyBookings,
  getTripBookings,
  cancelBooking,
  getDriverBookings,
} = require('../controllers/bookingController');

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, allowRoles('passenger', 'admin'), createBooking);

router.get('/my-bookings', protect, getMyBookings);

router.get('/trip/:tripId', protect, allowRoles('driver', 'admin'), getTripBookings);

router.patch('/:id/cancel', protect, cancelBooking);

router.get(
  '/driver-bookings',
  protect,
  allowRoles('driver', 'admin'),
  getDriverBookings
);
module.exports = router;