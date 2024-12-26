const router = require("express").Router();
const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const folderRoutes = require("./folderRoutes");

router.use("/api", authRoutes);
router.use("/api/doc", documentRoutes);
router.use("/api/folder", folderRoutes);

module.exports = router;
