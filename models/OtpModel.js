const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: [true, "OTP is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  expiredAt: {
    type: Date,
    default: new Date(+new Date() + 5 * 60 * 1000),
  },
});

module.exports = mongoose.model("OtpModel", otpSchema);
