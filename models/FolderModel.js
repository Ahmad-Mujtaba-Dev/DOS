const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema(
  {
    folderName: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Folder", FolderSchema);
