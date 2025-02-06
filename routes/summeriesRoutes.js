const router = require("express").Router();
const { saveDocumentSummeriesApi } = require("../controllers/SummeriesController");
const multer = require('multer');

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

router.post("/document-Summeries", upload.single('file'), saveDocumentSummeriesApi);

module.exports = router;
