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
// Serve uploaded product images and videos
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.includes("localhost")) return callback(null, true);
    // Allow Netlify, Vercel, Railway domains
    if (
      origin.includes("netlify.app") ||
      origin.includes("vercel.app") ||
      origin.includes("railway.app") ||
      origin.includes("onrender.com") ||
      origin === process.env.FRONTEND_URL
    ) return callback(null, true);
    return callback(null, true); // allow all for now
  },
  credentials: true,
}));

// Routes
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/stock",      require("./routes/stock"));
app.use("/api/users",      require("./routes/users"));
app.use("/api/orders",     require("./routes/orders"));
app.use("/api/ai",         require("./routes/ai"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", db: "MySQL" }));

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
