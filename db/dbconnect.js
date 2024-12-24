const mongoose = require("mongoose");
require("dotenv").config();

async function dbConnect() {
  console.log("process env", process.env.MONGO_URL);
  mongoose.set("strictQuery", true);
  mongoose
    .connect(process.env.MONGO_URL,    
    )
    .then(() => {
      console.log("Successfully connected to Database");
    })
    .catch((error) => {
      console.log("Unable to connect with Database");
      console.log("Database Error =>" + error);
    });
}

module.exports = dbConnect;
