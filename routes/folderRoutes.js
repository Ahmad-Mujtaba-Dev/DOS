const { createFolderApi , addDocumentToFolderApi } = require("../controllers/FolderController");

const router = require("express").Router();

router.post("/add-folder-Api", createFolderApi)
router.post('/add-docs-to-folder-Api', addDocumentToFolderApi)

module.exports = router;




