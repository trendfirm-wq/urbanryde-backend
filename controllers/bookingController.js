const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

const generateTicketCode = () => {
  return `UR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { tripId, seats_booked, pickup_point, customer_location } = req.body;

    if (!tripId || !seats_booked || !pickup_point) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Trip, seats booked, and pickup point are required',
      });
    }

    const seatsNumber = Number(seats_booked);

    if (!seatsNumber || seatsNumber < 1) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Seats booked must be at least 1',
      });
    }

    const trip = await Trip.findById(tripId).session(session);

    if (!trip) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.status !== 'scheduled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This trip is not available for booking',
      });
    }

    const existingBooking = await Booking.findOne({
      passenger: req.user._id,
      trip: trip._id,
      booking_status: { $ne: 'cancelled' },
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You have already booked this trip',
      });
    }

    const availableSeats = trip.total_seats - trip.booked_seats;

    if (seatsNumber > availableSeats) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats} seat(s) available`,
      });
    }

    const cleanCustomerLocation = customer_location
      ? {
          latitude:
            typeof customer_location.latitude === 'number'
              ? customer_location.latitude
              : Number(customer_location.latitude),
          longitude:
            typeof customer_location.longitude === 'number'
              ? customer_location.longitude
              : Number(customer_location.longitude),
          address: customer_location.address || '',
        }
      : undefined;

    const total_amount = seatsNumber * trip.price_per_seat;

    const booking = await Booking.create(
      [
        {
          passenger: req.user._id,
          trip: trip._id,
          seats_booked: seatsNumber,
          pickup_point: pickup_point.trim(),
          customer_location: cleanCustomerLocation,
          total_amount,
          ticket_code: generateTicketCode(),
          booking_status: 'confirmed',
        },
      ],
      { session }
    );

    trip.booked_seats += seatsNumber;
    await trip.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.user._id })
      .populate({
        path: 'trip',
        populate: {
          path: 'vehicle driver',
          select: 'vehicle_name vehicle_type plate_number full_name phone',
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

exports.getTripBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ trip: req.params.tripId })
      .populate('passenger', 'full_name phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip bookings',
      error: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.booking_status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Booking already cancelled',
      });
    }

    const trip = await Trip.findById(booking.trip).session(session);

    booking.booking_status = 'cancelled';
    await booking.save({ session });

    if (trip) {
      trip.booked_seats = Math.max(
        0,
        trip.booked_seats - booking.seats_booked
      );

      await trip.save({ session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Booking cancelled and seats restored',
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getDriverBookings = async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');

    const driverVehicles = await Vehicle.find({
      driver_user: req.user._id,
    });

    const vehicleIds = driverVehicles.map((vehicle) => vehicle._id);

    const trips = await Trip.find({
      vehicle: { $in: vehicleIds },
    });

    const tripIds = trips.map((trip) => trip._id);

    const bookings = await Booking.find({
      trip: { $in: tripIds },
    })
      .populate('passenger', 'full_name phone email')
      .populate({
        path: 'trip',
        populate: {
          path: 'vehicle',
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver bookings',
      error: error.message,
    });
  }
};