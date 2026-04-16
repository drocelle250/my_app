require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const studentRouter = require("./routes/students");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));


app.use("/students", studentRouter);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.log(error));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});