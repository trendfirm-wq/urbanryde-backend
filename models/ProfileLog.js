const mongoose = require("mongoose");

const profileLogSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      changes: Object,
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "ProfileLog",
    profileLogSchema
  );