const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./src/config/db");

// Routes
const authRoutes = require("./src/routes/authRoutes");

// Load environment variables
dotenv.config({
  path: [
    path.resolve(__dirname, ".env"),
    path.resolve(__dirname, "src/.env"),
  ],
});

// Connect to MongoDB
connectDB();

const app = express();

// =============================
// Middleware
// =============================

app.use(cors());

app.use(express.json());


// =============================
// Routes
// =============================

app.get("/", (req, res) => {
  res.send("Smart Footpath Portal Backend Running");
});

app.use("/api/auth", authRoutes);


// =============================
// Server
// =============================

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});