const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    route_from: {
      type: String,
      required: true,
      trim: true,
    },

    route_to: {
      type: String,
      required: true,
      trim: true,
    },

    pickup_points: [
      {
        name: String,
        time: String,
      },
    ],

    departure_time: {
      type: Date,
      required: true,
    },

    price_per_seat: {
      type: Number,
      required: true,
    },

    total_seats: {
      type: Number,
      required: true,
    },

    booked_seats: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);