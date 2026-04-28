const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicle_name: {
      type: String,
      required: true,
      trim: true,
    },

    vehicle_type: {
      type: String,
      enum: ['car', 'taxi', 'van', 'bus'],
      required: true,
    },

    plate_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    total_seats: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: null,
    },

    // 🔥 THIS IS THE IMPORTANT PART
    driver_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // optional display info
    driver: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      license: {
        type: String,
        trim: true,
      },
      photo: {
        type: String,
        default: null,
      },
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);