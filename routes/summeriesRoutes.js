const {  saveDocumentSummeriesApi } = require("../controllers/SummeriesController");

const router = require("express").Router();

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post("/document-Summeries", upload.single('file'), saveDocumentSummeriesApi)

module.exports = router;




