const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const TripLocation = require('../models/TripLocation');

exports.getTripLocation = async (req, res) => {
  try {
    const { tripId } = req.params;

    const location = await TripLocation.findOne({ trip: tripId })
      .populate('driver', 'full_name phone')
      .populate('trip');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'No live location found for this trip',
      });
    }

    res.json({
      success: true,
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip location',
      error: error.message,
    });
  }
};

exports.getTripTrackingData = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('vehicle')
      .populate('driver', 'full_name phone');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const liveLocation = await TripLocation.findOne({ trip: tripId });

    const bookings = await Booking.find({
      trip: tripId,
      booking_status: { $ne: 'cancelled' },
    }).populate('passenger', 'full_name phone');

   res.json({
  success: true,

  trip,

  driver: liveLocation
    ? {
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        heading: liveLocation.heading,
        speed: liveLocation.speed,
        accuracy: liveLocation.accuracy,
        altitude: liveLocation.altitude,
        last_updated: liveLocation.last_updated,
      }
    : null,

  pickupMarkers: bookings.map((booking) => ({
    bookingId: booking._id,
    passenger: booking.passenger,
    pickup_point: booking.pickup_point,
    customer_location: booking.customer_location,
    ticket_code: booking.ticket_code,
  })),
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking data',
      error: error.message,
    });
  }
};

exports.stopTripTracking = async (req, res) => {
  try {
    const { tripId } = req.params;

    const location = await TripLocation.findOneAndUpdate(
      { trip: tripId },
      { is_tracking: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Trip tracking stopped',
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop tracking',
      error: error.message,
    });
  }
};