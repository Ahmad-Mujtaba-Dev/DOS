const Folder = require("../models/FolderModel");
const Document = require("../models/DocumentModel");
const axios = require("axios");
const SummaryModel = require("../models/SummaryModel");

const saveDocumentSummeriesApi = async (req, res) => {
  console.log("req", req.file);
   try {
     const fileObject = {
       fieldname: req.file.fieldname,
       originalname: req.file.originalname,
       encoding: req.file.encoding,
       mimetype: req.file.mimetype,
       buffer: req.file.buffer.toString("base64"),
       size: req.file.size,
     };
 
     const analyzeResponse = await axios.post(
       "https://62d7-173-208-156-111.ngrok-free.app/process_file/",
       fileObject,
       { headers: { "Content-Type": "application/json" } }
     );
 
     console.log("analyzeResponse at line 47", analyzeResponse);
 
     const extractedData = analyzeResponse.data;
 
    //  const summary = await SummaryModel.create({
    //   summaryText :extractedData.health_summary,
      

    //  })

     return res.status(200).json({
       status: "success",
       message: "File analysis successful",
       data: extractedData,
     });
   } catch (error) {
     console.error("Error in uploadDocsSummariesApi:", error.message);
     res.status(500).json({ message: "Failed to Generate Summaries", error });
   }
};

module.exports = {
    saveDocumentSummeriesApi,
};
