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

// const addDocumentToFolderApi = async (req, res) => {
//     try {
//       const { docsId, folderId } = req.body;

//       const docs = await Document.findById({ _id: docsId });
//       console.log("SelectedDocs", SelectedDocs);
//       if (!docs) {
//           return res.status(400).json({
//             status: "error",
//             message: "Selected Docs not Found",
//           });
//         }

//       // const folder = await Folder.findByIdAndUpdate(
//       //   folderId,
//       //   { $addToSet: { documents: docsId } },
//       //   { new: true }
//       // );
//       // console.log("folder 32", folder);

//       // const myFolderData = await Folder.findOne({ _id: docsId });
//       // console.log(myFolderData, "myfolderData");

//       // res.status(200).json({
//       //   status: "success",
//       //   data: myFolderData,
//       //   message: "Docs Added to folder Successfully",
//       // });
//     } catch (error) {
//       res.status(500).json({ message: "Failed to add docs to folder", error });
//     }
//   };

const addDocumentToFolderApi = async (req, res) => {
  try {
    const { docsId, folderId } = req.body;
    console.log("folder",folderId)

    const docs = await Document.findOne({ _id: docsId });
    if (!docs) {
      return res.status(400).json({
        status: "error",
        message: "Selected Docs not Found",
      });
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: folderId },
      {
        $set: {
          documents: docs,
        },
      },
      { new: true }
    );
    console.log(folder, "folder");

    res.status(200).json({
      status: "success",
      message: "Docs Added to Folder  Successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "error adding docs to folder", error });
  }
};

module.exports = {
  createFolderApi,
  addDocumentToFolderApi,
};
