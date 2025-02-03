const {  saveDocumentSummeriesApi } = require("../controllers/SummeriesController");
const router = require("express").Router();
const multer = require('multer');
const path = require('path');

// Simple storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload')
    },
    filename: function (req, file, cb) {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

router.post("/document-Summeries", upload.single('file'), saveDocumentSummeriesApi);

module.exports = router;
