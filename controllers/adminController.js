const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Booking = require("../models/Booking");

exports.getDashboard = async (req, res) => {
  try {

    const [
      trips,
      vehicles,
      drivers,
      bookings,
      recentTrips,
      recentVehicles,
      recentDrivers,
    ] = await Promise.all([

      Trip.countDocuments(),

      Vehicle.countDocuments(),

      User.countDocuments({
        role: "driver",
      }),

      Booking.countDocuments(),

      Trip.find()
        .populate("vehicle")
        .sort({
          createdAt: -1,
        })
        .limit(5),

      Vehicle.find()
        .sort({
          createdAt: -1,
        })
        .limit(5),

      User.find({
        role: "driver",
      })
        .sort({
          createdAt: -1,
        })
        .limit(5),

    ]);

    res.json({

      success: true,

      stats: {

        trips,

        vehicles,

        drivers,

        bookings,

      },

      recentTrips,

      recentVehicles,

      recentDrivers,

    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};