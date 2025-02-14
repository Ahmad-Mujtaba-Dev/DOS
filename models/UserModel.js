const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    sparse: true,
    required: [true, "Last Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  profilePicture: {
    type: String,
    default: "",
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
  googleId: { type: String },
  facebookId: { type: String },
  password: {
    type: String,
    required: [true, "Password is required"],
    length: [8, "Password must be atleast 8 characters long"],
    trim: true,
  },
  role: {
    type: String,
    enum: ["admin", "patient", "super-admin"],
    default: "patient",
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

userSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
