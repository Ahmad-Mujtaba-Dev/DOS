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
} = require("../controllers/DocumentController");

const router = require("express").Router();
const upload = require("../middlewares/uploadDocs");
// {Document Part}
router.post("/uploadDocsApi", upload("Docs").single("file"), uploadDocsApi);
router.get("/getAllDocsApi", getAllDocsApi);
router.post("/addDocsLabelApi", addDocsLabelApi);
router.post("/addDocsTagsApi", addDocsTagsApi);
router.post("/downloadDocsApi", DownloadDocApi);
router.delete("/deleteDocsApi", DeleteDocsApi);
router.post("/editDocsLabelApi", EditDocsLabelApi);
router.get("/get-all-patient-api", getallPatient);
router.post("/assign-docs-to-patient", AssignDocstoPatientApi);
// {Categories Part}
router.post("/add-category-api", AddCategoriesApi);
router.get("/get-all-categories", getallCategories);
router.post("/categorize-docs-api" , CategorizeDocsApi);

module.exports = router;
