const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  summaryText: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Summary", SummarySchema);
