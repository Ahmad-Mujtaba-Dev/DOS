const mongoose = require("mongoose");

const CatagorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("Catagory", CatagorySchema);
