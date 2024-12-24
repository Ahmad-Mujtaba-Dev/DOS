const { uploadDocsApi } = require("../controllers/DocumentController");

const router = require("express").Router();
const upload = require("../middlewares/uploadDocs");

router.post("/uploadDocsApi", upload("Docs").single("file"), uploadDocsApi);

module.exports = router;
