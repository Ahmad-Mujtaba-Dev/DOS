const { uploadDocsApi,getAllDocsApi,DownloadDocApi,EditDocsLabelApi,DeleteDocsApi } = require("../controllers/DocumentController");

const router = require("express").Router();
const upload = require("../middlewares/uploadDocs");

router.post("/uploadDocsApi", upload("Docs").single("file"), uploadDocsApi);
router.get("/getAllDocsApi", getAllDocsApi)
router.post('/downloadDocsApi', DownloadDocApi)
router.delete('/deleteDocsApi', DeleteDocsApi)
router.post('/editDocsLabelApi', EditDocsLabelApi)

module.exports = router;