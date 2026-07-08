const Booking = require("../models/Booking");

exports.getProfileDashboard = async (req, res) => {
  try {
    const user = req.user;

    const bookings = await Booking.find({
      passenger: user._id,
    });

    const totalTrips = bookings.length;

    const upcomingTrips = bookings.filter(
      (b) =>
        b.booking_status === "confirmed" ||
        b.booking_status === "pending"
    ).length;

    const completedTrips = bookings.filter(
      (b) => b.booking_status === "completed"
    ).length;

    const cancelledTrips = bookings.filter(
      (b) => b.booking_status === "cancelled"
    ).length;

    res.json({
      success: true,

      user: {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        provider: user.provider,
        photo: user.photo || null,
      },

      stats: {
        totalTrips,
        upcomingTrips,
        completedTrips,
        cancelledTrips,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};