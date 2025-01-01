const Catagory = require("../models/catagoriesModel");
const Document = require("../models/DocumentModel");
const HealthProviderModal = require("../models/HealthProviderModel");
const User = require("../models/UserModel");
const fileFullPath = require("../util/fileFullPath");
const fs = require("fs");
const path = require("path");

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

const addDocsLabelApi = async (req, res) => {
  try {
    const { docsName, docsId } = req.body;
    const docs = await Document.findOne({ _id: docsId });
    console.log("docs", docs);

    await Document.findOneAndUpdate(
      { _id: docsId },
      {
        $set: {
          title: docsName,
        },
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Docs Label Added Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add document name", error });
  }
};

const addDocsTagsApi = async (req, res) => {
  try {
    const { tags, docsId } = req.body;

    if (!docsId || !Array.isArray(tags)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid input: docsId and tags are required",
      });
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { _id: docsId },
      { $set: { tags } },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        status: "fail",
        message: "Document not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Document tags added successfully",
      document: updatedDoc,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to add document tags",
      error: error.message,
    });
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

const getallPatient = async (req, res, next) => {
  try {
    const patient = await User.find({ role: "patient" });

    if (!patient || patient.length === 0) {
      return res.status(404).json({ message: "No patients found" });
    }

    const patients = [];

    await Promise.all(
      patient.map(async (user) => {
        const myPatientData = await getPatientData(user);
        patients.push(myPatientData);
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        patients,
      },
      message: "Patients fetched successfully",
    });
  } catch (error) {
    console.log("Error in get all Patients", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const AddCategoriesApi = async (req, res) => {
  try {
    const { name } = req.body;

    const existingCategory = await Catagory.findOne({ categoryName: name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Catagory.create({
      categoryName: name,
    });

    const categoryData = await getCategoryData(category);
    res.status(201).json({
      status: "success",
      data: {
        user: categoryData,
      },
      message: "categorie added successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

const getallCategories = async (req, res, next) => {
  try {
    const category = await Catagory.find({});

    if (!category || category.length === 0) {
      return res.status(404).json({ message: "No Category found" });
    }

    const categories = [];

    await Promise.all(
      category.map(async (user) => {
        const myCategoryData = await getCategoryData(user);
        categories.push(myCategoryData);
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        categories,
      },
      message: "Categories fetched successfully",
    });
  } catch (error) {
    console.log("Error in get all Categories", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const AssignDocstoPatientApi = async (req, res) => {
  try {
    const { docId, patientId } = req.body;

    if (!docId || !patientId) {
      return res
        .status(400)
        .json({ message: "docId and patientId are required" });
    }

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    document.patient = patient._id;
    await document.save();

    const populatedDocument = await Document.findById(docId)
      .populate("uploadedBy", "firstName lastName email")
      .populate(
        "patient",
        "firstName lastName email phone role active createdAt verified verifyAt"
      );

    res.status(200).json({
      status: "success",
      message: "Document assigned to patient successfully",
      document: populatedDocument,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error assigning document to patient",
      error: error.message,
    });
  }
};

const CategorizeDocsApi = async (req, res) => {
  try {
    const { categoryId, docId } = req.body;

    if (!docId || !categoryId) {
      return res
        .status(400)
        .json({ message: "categoryId and docsId are required" });
    }

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const category = await Catagory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    document.category = category.categoryName;
    await document.save();

    const populatedDocs = await Document.findById(docId)
      .populate("uploadedBy", "firstName lastName email")
      .populate("category", "categoryName");

    res.status(200).json({
      status: "success",
      message: "Document added to Category Successfull",
      document: populatedDocs,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error assigning document to category",
      error: error.message,
    });
  }
};

module.exports = {
  uploadDocsApi,
  getAllDocsApi,
  addDocsLabelApi,
  DownloadDocApi,
  DeleteDocsApi,
  EditDocsLabelApi,
  addDocsTagsApi,
  AssignDocstoPatientApi,
  AddCategoriesApi,
  getallPatient,
  getallCategories,
  CategorizeDocsApi,
};

const getDocsData = async (docs) => {
  return {
    title: docs?.title,
    description: docs?.description,
    category: docs?.category,
    tags: docs?.tags,
    fileUrl: fileFullPath(docs?.fileUrl),
  };
};

const getCategoryData = async (category) => {
  return {
    id: category._id,
    categoryName: category.categoryName,
    createdAt: category.createdAt,
  };
};

const getPatientData = async (user) => {
  let healthProvider = null;
  healthProvider = await HealthProviderModal.findOne({ _id: user._id });
  if (healthProvider) {
    healthProvider = {
      providerName: healthProvider?.providerName,
      providerAddress: healthProvider?.providerAddress,
      providerPhone: healthProvider?.phone,
      verified: healthProvider?.verified,
      active: healthProvider?.active,
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
