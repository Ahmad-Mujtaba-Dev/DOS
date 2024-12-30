const { uploadDocsApi,getAllDocsApi,DownloadDocApi,EditDocsLabelApi,DeleteDocsApi,getallPatient,AddCategoriesApi } = require("../controllers/DocumentController");

const router = require("express").Router();
const upload = require("../middlewares/uploadDocs");

router.post("/uploadDocsApi", upload("Docs").single("file"), uploadDocsApi);
router.get("/getAllDocsApi", getAllDocsApi)
router.post('/downloadDocsApi', DownloadDocApi)
router.delete('/deleteDocsApi', DeleteDocsApi)
router.post('/editDocsLabelApi', EditDocsLabelApi)
router.get('/get-all-patient-api' ,getallPatient)
router.post('/add-category-api', AddCategoriesApi)

module.exports = router;