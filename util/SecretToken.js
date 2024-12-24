require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (payload) => {
  return jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "24h",
  });
};
