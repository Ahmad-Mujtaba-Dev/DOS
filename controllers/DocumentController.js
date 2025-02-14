const Catagory = require("../models/CatagoriesModel");
const Document = require("../models/DocumentModel");
const HealthProviderModal = require("../models/HealthProviderModel");
const User = require("../models/UserModel");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: "https://s3.eu-north-1.amazonaws.com",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
  region: "eu-north-1",
});

const uploadDocsApi = async (req, res) => {
  console.log("files --->", req.files);
  try {
    console.log("req.body", req.body);
    const { id, folderName, summary } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "user not found" });
    }

    let category = await Catagory.findOne({ categoryName: folderName });
    if (!category) {
      category = await Catagory.create({
        categoryName: folderName,
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileName = file.originalname;
      console.log("fileName", fileName);
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `users/${id}/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId: id.toString(),
        },
      };

      const uploadedImage = await s3.upload(params).promise();

      return Document.create({
        patientId: id,
        fileUrl: uploadedImage.Location,
        categoryId: category._id,
        summary: summary // Add summary field
      });
    });

    const documents = await Promise.all(uploadPromises);

    const documentsData = [];

    await Promise.all(
      documents.map(async (doc) => {
        const mydocsData = await getDocsData(doc);
        documentsData.push(mydocsData);
      })
    );

    res.status(200).json({
      status: "success", 
      data: documentsData,
      message: "Documents Uploaded Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// const uploadDocsSummariesApi = async (req, res) => {
//   console.log("req", req.file);
//   try {
//     const fileObject = {
//       fieldname: req.file.fieldname,
//       originalname: req.file.originalname,
//       encoding: req.file.encoding,
//       mimetype: req.file.mimetype,
//       buffer: req.file.buffer.toString("base64"),
//       size: req.file.size,
//     };

//     // const filePath = path.join(__dirname, "uploadedFileDetails.txt");

//     //   const fileContent = `
//     //  {
//     //      "fieldname": "${fileObject.fieldname}",
//     //      "originalname": "${fileObject.originalname}",
//     //      "encoding": "${fileObject.encoding}",
//     //      "mimetype": "${fileObject.mimetype}",
//     //      "buffer": "${fileObject.buffer}",
//     //      "size": ${fileObject.size}
//     //  }`;

//     // fs.writeFileSync(filePath, fileContent, "utf8");

//     // console.log(`File details saved to ${filePath}`);

//     const analyzeResponse = await axios.post(
//       "https://62d7-173-208-156-111.ngrok-free.app/process_file/",
//       fileObject,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     console.log("analyzeResponse at line 47", analyzeResponse);

//     const extractedData = analyzeResponse.data;

//     return res.status(200).json({
//       status: "success",
//       message: "File analysis successful",
//       data: extractedData,
//     });
//   } catch (error) {
//     console.error("Error in uploadDocsSummariesApi:", error.message);
//     res.status(500).json({ message: "Failed to Generate Summaries", error });
//   }
// };

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

const addDocsLabelApi = async (req, res) => {
  try {
    const { docsName, docsId } = req.body;
    const docs = await Document.findOne({ _id: docsId });

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

    const document = await Document.findById(_id);

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
    console.log("document", document);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

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

const getAllDocsApi = async (req, res, next) => {
  try {
    if (req.user === undefined) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }
    const { id } = req.user;
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const myUser = await User.findById(id);
    if (!myUser) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }

    const docs = await Document.find({ userId: id });
    console.log("docs 302", docs);


    if (!docs || docs.length == 0) {
      return res
        .status(400)
        .json({ status: "error", message: "No Docs Found " });
    }

    const docsData = [];

    await Promise.all(
      docs.map(async (doc) => {
        const myDocData = await getDocsData(doc);
        docsData.push(myDocData);
      })
    );

    res.status(200).json({
      status: "success", 
      data: {
        docsData,
      },
      message: "Docs fetched successfully",
    });
  } catch (error) {
    console.log("Error in get all Patients", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getAllDocsForSummary = async (req, res, next) => {
  try {
    if (req.user === undefined) {
      return res.status(400).json({ status: "error", message: "Invalid user" });
    }
    const { id } = req.user;
    if (!id) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const myUser = await User.findById(id);
    if (!myUser) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }

    const docs = await Document.find({ userId: id, summary: { $exists: true, $ne: "" } });

    if (!docs || docs.length == 0) {
      return res
        .status(400)
        .json({ status: "error", message: "No Docs Found " });
    }

    const docsData = [];

    await Promise.all(
      docs.map(async (doc) => {
        const myDocData = await getDocsData(doc);
        docsData.push(myDocData);
      })
    );

    res.status(200).json({
      status: "success", 
      data: {
        docsData,
      },
      message: "Docs fetched successfully",
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

const updateDocsCategoryApi = async (req, res) => {
  try {
    const { docsId, categoryName, categoryId } = req.body;

    if (!docsId) {
      return res.status(400).json({
        status: "error",
        message: "Document ID is required"
      });
    }

    // Find the document first
    const document = await Document.findById(docsId);
    if (!document) {
      return res.status(404).json({
        status: "error",
        message: "Document not found"
      });
    }

    let category;
    // If categoryId is provided, use it directly
    if (categoryId) {
      category = await Catagory.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: "error",
          message: "Category not found with provided ID"
        });
      }
    } 
    // If categoryName is provided, find or create category
    else if (categoryName) {
      category = await Catagory.findOne({ categoryName });
      if (!category) {
        category = await Catagory.create({ categoryName });
      }
    } else {
      return res.status(400).json({
        status: "error",
        message: "Either categoryId or categoryName must be provided"
      });
    }

    // Update the document with new category
    document.categoryId = category._id;
    await document.save();

    // Get updated document data with populated fields
    const updatedDoc = await Document.findById(docsId)
      .populate('categoryId')
      .populate('patientId', 'firstName lastName email');

    const updatedDocData = {
      docsId: updatedDoc._id,
      userId: updatedDoc.patientId?._id,
      userName: updatedDoc.patientId ? `${updatedDoc.patientId.firstName} ${updatedDoc.patientId.lastName}` : null,
      fileUrl: updatedDoc.fileUrl,
      category: category.categoryName,
      categoryId: category._id,
      size: updatedDoc.size,
      createdAt: updatedDoc.createdAt,
      title: updatedDoc.title || updatedDoc.originalname
    };

    res.status(200).json({
      status: "success",
      data: updatedDocData,
      message: "Document category updated successfully"
    });
  } catch (error) {
    console.error("Error updating document category:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update document category",
      error: error.message
    });
  }
};

module.exports = {
  uploadDocsApi,
  getAllDocsApi,
  getAllDocsForSummary,
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
  updateDocsCategoryApi,
  // uploadDocsSummariesApi,
};

const getDocsData = async (docs) => {
  const categoriesData = await Catagory.findById(docs.categoryId);

  return {
    docsId: docs._id,
    userId: docs?.patientId,
    fileUrl: docs.fileUrl,
    category: categoriesData ? categoriesData.categoryName : null,
    categoryId: docs?.categoryId,
    size: docs.size,
    createdAt: docs.createdAt,
    title: docs.title || docs.originalname,
    summary: docs.summary || "", 
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
