const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const cors = require("cors");

const saveDocumentSummeriesApi = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log("Starting analysis request to external API...");
    
    const axiosConfig = {
      headers: {
        ...formData.getHeaders(),
        "Accept": "application/json",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 50000, // 30 second timeout
      validateStatus: (status) => status < 500, // Handle only 500+ as errors
    };

    try {
      const analyzeResponse = await axios.post(
        process.env.ANROK_LINK + "wav_file/",
        formData,
        axiosConfig
      );

      if (analyzeResponse.status !== 200) {
        throw new Error(`API responded with status ${analyzeResponse.status}: ${JSON.stringify(analyzeResponse.data)}`);
      }

      console.log("Analysis successful, processing response...");
      const extractedData = analyzeResponse.data;

      return res.status(200).json({
        status: "success",
        message: "File analysis successful",
        data: extractedData,
      });
    } catch (apiError) {
      console.error("API request failed:", apiError);
      throw new Error(`API request failed: ${apiError.message}`);
    }
  } catch (error) {
    console.error("Error in saveDocumentSummeriesApi:", error);
    
    return res.status(500).json({ 
      status: "error",
      message: "Failed to generate summaries",
      error: {
        message: error.message,
        type: error.name,
        response: error.response?.data || null,
      }
    });
  }
};

const saveFileSummeriesApi = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const fileObject = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer.toString("base64"),
      size: req.file.size,
    };

    console.log("Starting file analysis request...");
    
    const axiosConfig = {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 50000, // 30 second timeout
      validateStatus: (status) => status < 500, // Handle only 500+ as errors
    };

    try {
      const analyzeResponse = await axios.post(
        process.env.ANROK_LINK + "process_file/",
        fileObject,
        axiosConfig
      );

      if (analyzeResponse.status !== 200) {
        throw new Error(`API responded with status ${analyzeResponse.status}: ${JSON.stringify(analyzeResponse.data)}`);
      }

      console.log("File analysis successful, processing response...");
      const extractedData = analyzeResponse.data;

      return res.status(200).json({
        status: "success",
        message: "File analysis successful",
        data: extractedData,
      });
    } catch (apiError) {
      console.error("API request failed:", apiError);
      throw new Error(`API request failed: ${apiError.message}`);
    }
  } catch (error) {
    console.error("Error in saveFileSummeriesApi:", error);
    
    return res.status(500).json({ 
      status: "error",
      message: "Failed to generate summaries",
      error: {
        message: error.message,
        type: error.name,
        response: error.response?.data || null,
      }
    });
  }
};

module.exports = {
  saveDocumentSummeriesApi,
  saveFileSummeriesApi,
};
