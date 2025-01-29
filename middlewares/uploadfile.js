const multer = require("multer");

const storage = (path) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      console.log("Destination path:", path);
      console.log("Uploaded file:", file);
      cb(null, `uploads/${path}`);
    },
    filename: (req, file, cb) => {
      const sanitizedFileName = file.originalname.replace(/\s+/g, "_");
      const fullFileName = `${Date.now()}-${sanitizedFileName}`;
      cb(null, fullFileName);
    },
  });
};
8
const uploadfile = (path) => {
  return multer({ storage: storage(path) });
};

module.exports = uploadfile;
 