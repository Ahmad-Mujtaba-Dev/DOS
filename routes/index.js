const router = require("express").Router();
const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const folderRoutes = require("./folderRoutes");
const summeriesRoutes = require('./summeriesRoutes')
const chatRoutes = require('./chatRoutes')
const fileSummeriesRoutes = require('./fileSummeriesRoutes')
router.use("/api", authRoutes);
router.use("/api/doc", documentRoutes);
router.use("/api/folder", folderRoutes);
router.use("/api/summeries",summeriesRoutes)
router.use("/api/summeries",fileSummeriesRoutes)
router.use("/api/chat", chatRoutes);

module.exports = router;
