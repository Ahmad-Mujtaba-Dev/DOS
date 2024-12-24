const HealthProviderModal = require("../models/HealthProviderModel");
const Document = require('../models/DocumentModel');
const fileFullPath = require("../util/fileFullPath");
require("dotenv").config();

const uploadDocsApi = async (req, res) => {
    console.log("req.file", req.file)
    try {
        const {
            title,
            description,
            category,
        } = req.body;
    
        const DocsData = await Document.create({
            title,
            description,
            category,
            fileUrl:req.file.path
        });
        
    
        const docsData = await getDocsData(DocsData);
        res.status(201).json({
          status: "success",
          data: {
            docs: docsData,
          },
          message:
            "Docs Uploaded Sucessfully,",
        });
      } catch (error) {
        console.log("Error in signup", error);
        res.status(400).json({ status: "error", message: error.message });
      }
};

const getAllDocsApi = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const documents = await Document.find({ uploadedBy: req.user.id })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Document.countDocuments({ uploadedBy: req.user.id });
        res.status(200).json({ documents, total });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch documents', error });
    }
};

const DownloadDocApi = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const filePath = path.join(uploadDir, document.fileUrl);
        res.download(filePath, document.title);
    } catch (error) {
        res.status(500).json({ message: 'Failed to download document', error });
    }
};

const DeleteDocsApi = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const filePath = path.join(uploadDir, document.fileUrl);
        fs.unlinkSync(filePath); // Delete the file from the file system

        await document.deleteOne();
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete document', error });
    }
};

const EditDocsApi = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Expected: { category, tags }
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        Object.assign(document, updates);
        await document.save();
        res.status(200).json({ message: 'Document updated successfully', document });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update document', error });
    }
};

module.exports = {
    uploadDocsApi,
    getAllDocsApi,
    DownloadDocApi,
    EditDocsApi,
    DeleteDocsApi
};

const getDocsData = async (docs) => {
  return {
    title:docs.title,
    description:docs.description,
    category:docs.category,
    fileUrl: fileFullPath(docs.fileUrl),
  };
};



