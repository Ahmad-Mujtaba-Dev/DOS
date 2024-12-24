const mongoose = require("mongoose");

const HealthProviderSchema = new mongoose.Schema({
  providerName: {
    type: String,
    required: [true, "Health provider Name is required"],
    trim: true,
  },
  providerAddress: {
    type: String,
    required: [true, "Health provier address is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    code: {
      type: String,
    },
    number: {
      type: String,
      trim: true,
    },
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  verified: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  verifyAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
  },

});

module.exports = mongoose.model("HealthProviderSchema", HealthProviderSchema);
