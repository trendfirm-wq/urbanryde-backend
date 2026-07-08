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
      console.log("============== GOOGLE MAPS ERROR ==============");
console.log(mapError.message);

if (mapError.response) {
  console.log(mapError.response.data);
}

console.log("Origin:", route_from);
console.log("Destination:", route_to);
console.log("API KEY:", process.env.GOOGLE_MAPS_API_KEY);
console.log("===============================================");
    }

    const trip = await Trip.create({
  vehicle,
  driver: foundVehicle.driver_user,
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
  .populate({
    path: "vehicle",
    populate: {
      path: "driver_user",
      select: "full_name phone",
    },
  });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const availableSeats = trip.total_seats - trip.booked_seats;
console.log("Vehicle:", trip.vehicle);
console.log("Driver:", trip.driver);
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
exports.startTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    trip.trip_status = 'in_progress';
    trip.started_at = new Date();

    await trip.save();

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    trip.trip_status = 'completed';
    trip.completed_at = new Date();

    await trip.save();

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.searchTrips = async (req, res) => {
  try {
    const { origin, destination } = req.query;

    console.log("Origin:", origin);
    console.log("Destination:", destination);

    const trips = await Trip.find({
      route_from: {
        $regex: origin || "",
        $options: "i",
      },
      route_to: {
        $regex: destination || "",
        $options: "i",
      },
    });

    console.log("Trips Found:", trips.length);

    const formattedTrips = trips.map((trip) => ({
      ...trip.toObject(),
      availableSeats:
        (trip.total_seats || 0) - (trip.booked_seats || 0),
    }));

    res.json({
      success: true,
      trips: formattedTrips,
    });

  } catch (err) {
    console.error("SEARCH TRIPS ERROR:");
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getNearbyTrips = async (req, res) => {
  try {
 const trips = await Trip.find({
  trip_status: "scheduled",
  departure_time: { $gte: new Date() },
}).populate({
  path: "vehicle",
  populate: {
    path: "driver_user",
    select: "full_name phone",
  },
});

console.log("Trips Found:", trips.length);

trips.forEach((trip) => {
  console.log({
    id: trip._id,
    from: trip.route_from,
    to: trip.route_to,
    trip_status: trip.trip_status,
    start_location: trip.start_location,
  });
});

    const formattedTrips = trips
  .filter((trip) => {
    const availableSeats =
      trip.total_seats - trip.booked_seats;

    return (
      trip.start_location?.latitude &&
      trip.start_location?.longitude &&
      availableSeats > 0
    );
  })
     .map((trip) => ({
  _id: trip._id,

  vehicle: trip.vehicle,

  route_from: trip.route_from,
  route_to: trip.route_to,

  departure_time: trip.departure_time,

  price_per_seat: trip.price_per_seat,

  trip_status: trip.trip_status,

  availableSeats:
    trip.total_seats -
    trip.booked_seats,

  start_location: trip.start_location,

  destination_location:
    trip.destination_location,
}));
     console.log("Trips Found:", trips.length);
console.log(JSON.stringify(formattedTrips, null, 2));
console.log("Formatted Trips:");
console.log(JSON.stringify(formattedTrips, null, 2));
    res.json({
      success: true,
      trips: formattedTrips,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.deleteTrip = async (req, res) => {
  try {

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    await trip.deleteOne();

    res.json({
      success: true,
      message: "Trip deleted successfully",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
exports.deleteDriver = async (req, res) => {

    try{

        const driver =
        await User.findById(req.params.id);

        if(!driver){

            return res.status(404).json({
                success:false,
                message:"Driver not found",
            });

        }

        await driver.deleteOne();

        res.json({
            success:true,
            message:"Driver deleted successfully",
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message,
        });

    }

};