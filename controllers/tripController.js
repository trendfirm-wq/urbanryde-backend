const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const { getRouteData } = require('../utils/mapService');

exports.createTrip = async (req, res) => {
  try {
    const {
      vehicle,
      route_from,
      route_to,
      pickup_points,
      departure_time,
      price_per_seat,
    } = req.body;

    const foundVehicle = await Vehicle.findById(vehicle);

    if (!foundVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    if (!foundVehicle.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is currently inactive',
      });
    }

    let routeData = {
      start_location: null,
      destination_location: null,
      route_polyline: '',
      route_coordinates: [],
    };

    try {
      routeData = await getRouteData({
        origin: `${route_from}, Ghana`,
        destination: `${route_to}, Ghana`,
      });
    } catch (mapError) {
      console.log('Route generation failed:', mapError.message);
    }

    const trip = await Trip.create({
      vehicle,
      driver: req.user._id,
      route_from,
      route_to,
      pickup_points,
      departure_time,
      price_per_seat,
      total_seats: foundVehicle.total_seats,
      ...routeData,
    });

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message,
    });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('vehicle')
      .populate('driver', 'full_name phone')
      .sort({ departure_time: 1 });

    const formattedTrips = trips.map((trip) => {
      const availableSeats = trip.total_seats - trip.booked_seats;

      let statusLabel = 'Available';
      if (availableSeats === 0) statusLabel = 'Full';
      else if (availableSeats <= 2) statusLabel = 'Almost Full';

      return {
        ...trip._doc,
        availableSeats,
        statusLabel,
      };
    });

    res.json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message,
    });
  }
};

exports.getSingleTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver', 'full_name phone');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const availableSeats = trip.total_seats - trip.booked_seats;

    res.json({
      success: true,
      trip: {
        ...trip._doc,
        availableSeats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message,
    });
  }
};

exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    trip.status = status;
    await trip.save();

    res.json({
      success: true,
      message: 'Trip status updated',
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message,
    });
  }
};

exports.getDriverTrips = async (req, res) => {
  try {
    const driverVehicles = await Vehicle.find({
      driver_user: req.user._id,
    });

    const vehicleIds = driverVehicles.map((vehicle) => vehicle._id);

    const trips = await Trip.find({
      vehicle: { $in: vehicleIds },
    })
      .populate('vehicle')
      .sort({ departure_time: 1 });

    const formattedTrips = trips.map((trip) => {
      const availableSeats = trip.total_seats - trip.booked_seats;

      return {
        ...trip._doc,
        availableSeats,
      };
    });

    res.json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver trips',
      error: error.message,
    });
  }
};