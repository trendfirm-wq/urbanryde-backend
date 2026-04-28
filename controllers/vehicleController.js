const Vehicle = require('../models/Vehicle');

exports.createVehicle = async (req, res) => {
  try {
    const {
      vehicle_name,
      vehicle_type,
      plate_number,
      total_seats,
      image,
      driver_user,
      driver,
    } = req.body;

    if (
      !vehicle_name ||
      !vehicle_type ||
      !plate_number ||
      !total_seats ||
      !driver_user ||
      !driver?.name ||
      !driver?.phone
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicle details and select a driver',
      });
    }

    const vehicleExists = await Vehicle.findOne({
      plate_number: plate_number.toUpperCase(),
    });

    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this plate number already exists',
      });
    }

    const vehicle = await Vehicle.create({
      vehicle_name,
      vehicle_type,
      plate_number: plate_number.toUpperCase(),
      total_seats: Number(total_seats),
      image: image || null,
      driver_user,
      driver: {
        name: driver.name,
        phone: driver.phone,
        license: driver.license || '',
        photo: driver.photo || null,
      },
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: 'Company vehicle added successfully',
      vehicle,
    });
  } catch (error) {
    console.log('Create vehicle backend error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      error: error.message,
    });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('driver_user', 'full_name email phone role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.log('Get vehicles backend error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message,
    });
  }
};

exports.getMyVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      driver_user: req.user._id,
    }).populate('driver_user', 'full_name email phone role');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle assigned to this driver',
      });
    }

    res.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.log('Get my vehicle backend error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned vehicle',
      error: error.message,
    });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    const allowedFields = [
      'vehicle_name',
      'vehicle_type',
      'plate_number',
      'total_seats',
      'image',
      'driver_user',
      'driver',
      'is_active',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'plate_number') {
          vehicle[field] = req.body[field].toUpperCase();
        } else {
          vehicle[field] = req.body[field];
        }
      }
    });

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error) {
    console.log('Update vehicle backend error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message,
    });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    await vehicle.deleteOne();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    console.log('Delete vehicle backend error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message,
    });
  }
};