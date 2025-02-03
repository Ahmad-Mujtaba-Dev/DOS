const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const dbConnect = require("../db/dbconnect");  // Ensure the correct path
require("dotenv").config();

const app = express();
dbConnect();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/file", express.static("file"));

const passport = require("passport");

// CORS options
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

// Routes
const routes = require("../routes/index"); // Ensure correct path
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("Hello from Vercel!");
});

// Export the handler for Vercel
module.exports = app;
