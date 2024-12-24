const router = require("express").Router();
const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");

router.use("/api", authRoutes);
router.use("/api/doc",documentRoutes )

module.exports = router;