const mongoose = require('mongoose');

const tripLocationSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
accuracy: {
  type: Number,
  default: 0,
},

altitude: {
  type: Number,
  default: 0,
},

last_updated: {
  type: Date,
  default: Date.now,
},
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    heading: {
      type: Number,
      default: 0,
    },
start_notification_sent: {
  type: Boolean,
  default: false,
},
    speed: {
      type: Number,
      default: 0,
    },

    is_tracking: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripLocation', tripLocationSchema);