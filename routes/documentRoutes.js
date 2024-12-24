const {
    uploadDocsApi,
  } = require("../controllers/DocumentController");
  
  const router = require("express").Router();
  
  router.post("/uploadDocsApi", uploadDocsApi);

  module.exports = router;
  