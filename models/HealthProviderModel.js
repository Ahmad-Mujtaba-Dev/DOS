const mongoose = require("mongoose");

const HealthProviderSchema = new mongoose.Schema({
  providerName: {
    type: String,
  },
  providerAddress: {
    type: String,
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
