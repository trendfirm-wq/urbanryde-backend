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