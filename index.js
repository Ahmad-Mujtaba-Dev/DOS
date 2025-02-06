// Load environment variables and dependencies
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
// const passport = require("./util/passport-config"); 

// Initialize app
const app = express();
require("dotenv").config();

// Routes
const routes = require("./routes/index");
const dbConnect = require("./db/dbconnect");
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
console.log(" process.env.SESSION_SECRET", process.env.SESSION_SECRET)
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

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/", routes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
