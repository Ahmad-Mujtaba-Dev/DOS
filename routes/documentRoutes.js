const {
  uploadDocsApi,
  CategorizeDocsApi,
  getAllDocsApi,
  DownloadDocApi,
  AssignDocstoPatientApi,
  EditDocsLabelApi,
  DeleteDocsApi,
  getallPatient,
  AddCategoriesApi,
  getallCategories,
  addDocsLabelApi,
  addDocsTagsApi,
  updateDocsCategoryApi,
  getAllDocsForSummary,
} = require("../controllers/DocumentController");
// const upload = require("../middlewares/uploadDocs");

const router = require("express").Router();
// const { upload }= require("../middlewares/uploadDocs");
const auth = require("../middlewares/auth");

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// {Document Part}
router.post("/uploadDocsApi", upload.array('file'), uploadDocsApi);
router.get("/getAllDocsApi", auth , getAllDocsApi);
router.get("/getAllDocsForSummary", auth , getAllDocsForSummary);
router.post("/addDocsLabelApi", addDocsLabelApi);
router.post("/addDocsTagsApi", addDocsTagsApi);
router.post("/downloadDocsApi", DownloadDocApi);
router.post("/deleteDocsApi", DeleteDocsApi);

router.post("/editDocsLabelApi", EditDocsLabelApi);
router.post("/update-docs-category", updateDocsCategoryApi);
router.get("/get-all-patient-api", getallPatient);
router.post("/assign-docs-to-patient", AssignDocstoPatientApi);
// {Categories Part}
router.post("/add-category-api", AddCategoriesApi);
router.get("/get-all-categories", getallCategories);
router.post("/categorize-docs-api" , CategorizeDocsApi);

// {Document Summeries}
// router.post("/document-Summeries", upload.single('file'), uploadDocsSummariesApi);

module.exports = router;
