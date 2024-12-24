
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token =
      req.headers.authorization || req.cookies.token || req.body.token;
    if (!token) {
      return res
        .status(400)
        .json({ status: "error", message: "Token not found" });
    }
    jwt.verify(token.split(" ")[1], process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.log("Error in verifyToken", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = verifyToken;
