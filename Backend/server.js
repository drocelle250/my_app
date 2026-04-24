require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Connect to MySQL and sync tables
connectDB();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Routes
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/stock",      require("./routes/stock"));
app.use("/api/users",      require("./routes/users"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", db: "MySQL" }));

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
