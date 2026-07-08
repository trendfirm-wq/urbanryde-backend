const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      sparse: true,
    },

    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    
region: {
  type: String,
  trim: true,
  default: "",
},

city: {
  type: String,
  trim: true,
  default: "",
},

emergency_name: {
  type: String,
  trim: true,
  default: "",
},

emergency_phone: {
  type: String,
  trim: true,
  default: "",
},

driver_license: {
  type: String,
  trim: true,
  default: "",
},

vehicle_model: {
  type: String,
  trim: true,
  default: "",
},

vehicle_color: {
  type: String,
  trim: true,
  default: "",
},

plate_number: {
  type: String,
  trim: true,
  uppercase: true,
  default: "",
},
    password: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    google_id: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["passenger", "driver", "admin"],
      default: "passenger",
    },

    expo_push_token: {
      type: String,
      default: "",
    },

    is_phone_verified: {
      type: Boolean,
      default: false,
    },

    phone_otp: {
      type: String,
      default: null,
    },

    phone_otp_expires: {
      type: Date,
      default: null,
    },
reset_password_otp: {
  type: String,
  default: null,
},

reset_password_otp_expires: {
  type: Date,
  default: null,
},
    is_active: {
      type: Boolean,
      default: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },

    delete_reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);