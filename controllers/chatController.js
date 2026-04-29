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