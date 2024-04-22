const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { PORT, MONGODB_URL } = require("./config");

const port = PORT;
const mongoURI = MONGODB_URL;

mongoose.connect(mongoURI);

mongoose.connection.on("connected", () => {
  console.log("Connected");
});
mongoose.connection.on("error", (error) => {
  console.log(`Error connecting to DB: ${error}`);
});

require("./models/User");
require("./models/Tweet");

app.use(cors());
app.use(express.json());

app.use(require("./routes/AuthRoute"));
app.use(require("./routes/UserRoute"));
app.use(require("./routes/TweetRoute"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
