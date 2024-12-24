const mongoose = require("mongoose");

const AuthSchema = new mongoose.Schema({
  googleId: { type: String },
  facebookId: { type: String },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  notifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  ],
});

module.exports = mongoose.model("AuthModel", AuthSchema);
