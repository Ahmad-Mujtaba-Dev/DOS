const axios = require("axios");
const fs = require('fs');
const FormData = require('form-data');

const saveDocumentSummeriesApi = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No WAV file uploaded"
      });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: 'audio/wav'
    });

    console.log("formData",formData,req.file.path);

    const analyzeResponse = await axios.post(
      "https://a330-173-208-156-111.ngrok-free.app/wav_file/",
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    const extractedData = analyzeResponse.data;
    
    // Remove the file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });

    console.log("extractedData", extractedData);

    return res.status(200).json({
      status: "success",
      message: "File analysis successful",
      data: extractedData
    });
  } catch (error) {
    console.error("Error in uploadDocsSummariesApi:", error.message);
    res.status(500).json({ message: "Failed to Generate Summaries", error: error.message });
  }
};

const saveFileSummeriesApi = async (req, res) => {
  console.log("reqqq", req.file);
   try {
     const fileObject = {
       fieldname: req.file.fieldname,
       originalname: req.file.originalname,
       encoding: req.file.encoding,
       mimetype: req.file.mimetype,
       buffer: req.file.buffer.toString("base64"),
       size: req.file.size,
     };

     console.log("fileObject",req.file);
     const analyzeResponse = await axios.post(
       "https://a330-173-208-156-111.ngrok-free.app/process_file/",
       fileObject,
       { headers: { "Content-Type": "application/json" } }
     );
     const extractedData = analyzeResponse.data;

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
    saveFileSummeriesApi
};
