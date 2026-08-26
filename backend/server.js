const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./src/config/db");

// Load environment variables
dotenv.config({ path: [path.resolve(__dirname, ".env"), path.resolve(__dirname, "src/.env")] });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
const complaintsRoutes = require("./src/routes/complaints");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaints", complaintsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Smart Footpath Portal Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

