const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
  },
  
  lastName: {
    type: String,
  },

  email: {
    type: String,
    required: [true, "Email is required"],
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

  password: {
    type: String,
    required: [true, "Password is required"],
    length: [8, "Password must be atleast 8 characters long"],
    trim: true,
  },

  role: {
    type: String,
    enum: ["admin", "user", "super-admin"],
    default: "user",
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

adminSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
