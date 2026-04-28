const express = require('express');

const {
  createVehicle,
  getAllVehicles,
  getMyVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');

const {
  protect,
  allowRoles,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, allowRoles('admin'), createVehicle);

router.get('/', protect, allowRoles('admin'), getAllVehicles);

router.get('/my-vehicle', protect, allowRoles('driver'), getMyVehicle);

router.patch('/:id', protect, allowRoles('admin'), updateVehicle);

router.delete('/:id', protect, allowRoles('admin'), deleteVehicle);

module.exports = router;