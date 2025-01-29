const router = require("express").Router();
const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const folderRoutes = require("./folderRoutes");
const summeriesRoutes = require('./summeriesRoutes')

router.use("/api", authRoutes);
router.use("/api/doc", documentRoutes);
router.use("/api/folder", folderRoutes);
router.use("/api/summeries",summeriesRoutes)

module.exports = router;
