const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');

const canAccessBookingChat = async (user, bookingId) => {
  const booking = await Booking.findById(bookingId).populate('trip');

  if (!booking) {
    return {
      allowed: false,
      status: 404,
      message: 'Booking not found',
    };
  }

  if (user.role === 'admin') {
    return { allowed: true, booking };
  }

  if (user.role === 'passenger') {
    if (String(booking.passenger) === String(user._id)) {
      return { allowed: true, booking };
    }

    return {
      allowed: false,
      status: 403,
      message: 'You cannot access this chat',
    };
  }

  if (user.role === 'driver') {
    const trip = await Trip.findById(booking.trip);

    if (!trip) {
      return {
        allowed: false,
        status: 404,
        message: 'Trip not found',
      };
    }

    const vehicle = await Vehicle.findById(trip.vehicle);

    if (vehicle && String(vehicle.driver_user) === String(user._id)) {
      return { allowed: true, booking };
    }

    return {
      allowed: false,
      status: 403,
      message: 'You cannot access this chat',
    };
  }

  return {
    allowed: false,
    status: 403,
    message: 'You cannot access this chat',
  };
};

exports.getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const access = await canAccessBookingChat(req.user, bookingId);

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const messages = await ChatMessage.find({ booking: bookingId })
      .populate('sender', 'full_name phone email role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const access = await canAccessBookingChat(req.user, bookingId);

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const chatMessage = await ChatMessage.create({
      booking: bookingId,
      sender: req.user._id,
      sender_role: req.user.role,
      message: message.trim(),
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id).populate(
      'sender',
      'full_name phone email role'
    );

    res.status(201).json({
      success: true,
      message: 'Message sent',
      chatMessage: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};
exports.getDriverConversations = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Find all trips assigned to this driver
    const trips = await Trip.find({
      driver: driverId,
    }).select("_id");

    const tripIds = trips.map((trip) => trip._id);

    // Find bookings on those trips
    const bookings = await Booking.find({
      trip: { $in: tripIds },
    })
      .populate("passenger", "full_name phone")
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await ChatMessage.findOne({
          booking: booking._id,
        }).sort({ createdAt: -1 });

        const unread = await ChatMessage.countDocuments({
          booking: booking._id,
          sender_role: "passenger",
          read: false,
        });

        return {
          bookingId: booking._id,
          ticket_code: booking.ticket_code,
          passenger: booking.passenger,
          last_message: lastMessage?.message || "",
          last_message_time: lastMessage?.createdAt || null,
          unread,
        };
      })
    );

    res.status(200).json({
      conversations,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getPassengerConversations = async (req, res) => {
  try {
    const passengerId = req.user.id;

    const bookings = await Booking.find({
      passenger: passengerId,
    })
      .populate({
        path: "trip",
        populate: {
          path: "driver",
          select: "full_name phone",
        },
      })
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await ChatMessage.findOne({
          booking: booking._id,
        }).sort({ createdAt: -1 });

        const unread = await ChatMessage.countDocuments({
          booking: booking._id,
          sender_role: "driver",
          read: false,
        });

        return {
          bookingId: booking._id,
          ticket_code: booking.ticket_code,
          driver: booking.trip?.driver,
          last_message: lastMessage?.message || "",
          last_message_time: lastMessage?.createdAt || null,
          unread,
        };
      })
    );

    res.status(200).json({
      conversations,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};