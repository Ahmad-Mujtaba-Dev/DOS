const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  folder: { type: String },
  category: { type: String },
  fileUrl: { type: String},
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },  
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", DocumentSchema);
