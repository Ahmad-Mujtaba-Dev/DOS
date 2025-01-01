const Folder = require("../models/FolderModel");
const Document = require("../models/DocumentModel");

const createFolderApi = async (req, res) => {
  try {
    const { folderName, userId } = req.body;
    if (!folderName) {
      return res.status(400).json({
        status: "error",
        message: "folderName is Required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User not Found",
      });
    }

    const isfolderExist = await Folder.findOne({ folderName });
    if (isfolderExist) {
      return res
        .status(400)
        .json({ status: "error", message: "Folder already in use" });
    }

    const newFolder = await Folder.create({
      folderName,
      createdBy: userId,
    });

    res.status(200).json({
      status: "success",
      data: newFolder,
      message: "Folder Created Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create folder", error });
  }
};

const addDocumentToFolderApi = async (req, res) => {
  try {
    const { folderId, docId } = req.body;

    if (!docId || !folderId) {
      return res
        .status(400)
        .json({ message: "folderId and docsId are required" });
    }

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    document.folder = folder.folderName;
    await document.save();

    const populatedDocs = await Document.findById(docId)
      .populate("uploadedBy", "firstName lastName email")
      .populate("folder", "folderName");

    res.status(200).json({
      status: "success",
      message: "Document added to Folder Successfull",
      document: populatedDocs,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error assigning document to folder",
      error: error.message,
    });
  }
};

module.exports = {
  createFolderApi,
  addDocumentToFolderApi,
};
