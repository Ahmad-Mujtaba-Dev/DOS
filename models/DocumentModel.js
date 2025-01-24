const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  folder: { type: String },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Catagory",
  },
  fileUrl: { type: String},
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },  
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", DocumentSchema);
