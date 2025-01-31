
const router = require("express").Router();

const multer = require('multer');
const { saveFileSummeriesApi } = require("../controllers/SummeriesController");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post("/file-summeries", upload.single('file'), saveFileSummeriesApi)

module.exports = router;

