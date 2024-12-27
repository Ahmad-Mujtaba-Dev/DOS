const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    role: { type: String, enum: ["Super Admin", "Admin"], required: true },
    status: { type: String, enum: ["Pending", "Accepted"], default: "Pending" },
    invitationToken: { type: String, required: true }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", InvitationSchema);
