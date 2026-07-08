const express = require('express');

const {
  createBooking,
  getMyBookings,
  getTripBookings,
  cancelBooking,
  getDriverBookings,
  pickupPassenger,
  getBookingById,
  deleteBooking,
  dropoffPassenger,
} = require("../controllers/bookingController");

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, allowRoles('passenger', 'admin'), createBooking);

router.get('/my-bookings', protect, getMyBookings);

router.get('/trip/:tripId', protect, allowRoles('driver', 'admin'), getTripBookings);

router.patch('/:id/cancel', protect, cancelBooking);
router.get("/:id", protect, getBookingById);
router.get(
  '/driver-bookings',
  protect,
  allowRoles('driver', 'admin'),
  getDriverBookings
);
router.patch(
  '/:id/pickup',
  protect,
  allowRoles('driver'),
  pickupPassenger
);
router.delete(
  "/:id",
  protect,
  deleteBooking
);
router.patch(
"/:id/dropoff",
protect,
allowRoles("driver"),
dropoffPassenger
);
module.exports = router;