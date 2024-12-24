const HealthProviderModal = require("../models/HealthProviderModel");
require("dotenv").config();

const uploadDocsApi = async (req, res) => {
    try {
        const { title, description, category, tags } = req.body;
        const file = req.file; 
        
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const newDocument = new Document({
            title,
            description,
            category,
            tags,
            fileUrl: `/uploads/${file.filename}`,
            uploadedBy: req.user.id 
        });

        await newDocument.save();
        res.status(201).json({ message: 'Document uploaded successfully', documentId: newDocument._id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload document', error });
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

const getUserData = async (user) => {
  let healthProvider = null;

  healthProvider = await HealthProviderModal.findOne({ userId: user._id });
  if (healthProvider) {
    healthProvider = {
      providerName: healthProvider.providerName,
      providerAddress: healthProvider.providerAddress,
      providerPhone: healthProvider.phone,
      verified: healthProvider.verified,
      active: healthProvider.active,
    };
  }

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    verified: user.verified,
    verifyAt: user.verifyAt,
    healthProvider,
  };
};



