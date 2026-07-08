const express = require('express');

const {
  createTrip,
  getAllTrips,
  getSingleTrip,
  updateTripStatus,
  getDriverTrips,
  startTrip,
  completeTrip,
  searchTrips,
  getNearbyTrips,
  deleteTrip,
} = require("../controllers/tripController");

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, allowRoles('admin'), createTrip);

router.get('/', getAllTrips);

router.get("/search", searchTrips);

router.get(
  "/nearby",
  getNearbyTrips
);

router.get(
  '/driver-trips',
  protect,
  allowRoles('driver', 'admin'),
  getDriverTrips
);

router.get('/:id', getSingleTrip);

router.patch(
  '/:id/status',
  protect,
  allowRoles('driver', 'admin'),
  updateTripStatus
);

router.patch(
  '/:id/start',
  protect,
  allowRoles('driver'),
  startTrip
);

router.patch(
  '/:id/complete',
  protect,
  allowRoles('driver'),
  completeTrip
);
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteTrip
);

module.exports = router;