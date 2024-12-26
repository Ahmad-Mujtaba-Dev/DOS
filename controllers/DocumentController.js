const Document = require("../models/DocumentModel");
const fileFullPath = require("../util/fileFullPath");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
// const uploadDir = path.resolve("../uploads/Docs");

const uploadDocsApi = async (req, res) => {
  console.log("req.file", req.file);
  try {
    const { title, description, category } = req.body;

    const DocsData = await Document.create({
      title,
      description,
      category,
      fileUrl: req.file.path,
    });

    const docsData = await getDocsData(DocsData);
    console.log("docsData 22", docsData);
    res.status(200).json({
      status: "success",
      data: {
        docs: docsData,
      },
      message: "Docs Uploaded Sucessfully,",
    });
  } catch (error) {
    console.log("Error in signup", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getAllDocsApi = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.params;
    const documents = await Document.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: "Failed fetch documents", error });
  }
};

const DownloadDocApi = async (req, res) => {
  try {
    const { _id } = req.body;
    console.log("id", _id);

    const document = await Document.findById(_id);
    console.log("document 55", document);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = path.normalize(path.join(document.fileUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, document.title, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({ message: "Error downloading file", error: err });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to download document", error });
  }
};

const DeleteDocsApi = async (req, res) => {
  try {
    const { docsId } = req.body;
    const document = await Document.findById({ _id: docsId });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = path.join(document.fileUrl);
    fs.unlinkSync(filePath);

    await document.deleteOne();
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete document", error });
  }
};

const EditDocsLabelApi = async (req, res) => {
  try {
    const { docsId, title } = req.body;

    const docs = await Document.findById({ _id: docsId });
    if (!docs) {
      return res.status(400).json({
        status: "error",
        message: "Docs not found",
      });
    }

    await Document.findOneAndUpdate(
      { _id: docsId },
      { $set: { title } },
      { new: true }
    );
    const myDocsData = await Document.findOne({ _id: docsId });

    res.status(200).json({
      status: "success",
      data: myDocsData,
      message: "Document Label Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete document", error });
  }
};

module.exports = {
  uploadDocsApi,
  getAllDocsApi,
  DownloadDocApi,
  DeleteDocsApi,
  EditDocsLabelApi,
};

const getDocsData = async (docs) => {
  return {
    title: docs?.title,
    description: docs?.description,
    category: docs?.category,
    fileUrl: fileFullPath(docs?.fileUrl),
  };
};
