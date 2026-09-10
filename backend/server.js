const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ==========================================
// 1. LOAD ENVIRONMENT CONFIGURATION
// ==========================================
dotenv.config({ path: [path.resolve(__dirname, ".env"), path.resolve(__dirname, "src/.env")] });

const connectDB = require("./src/config/db");
const cloudinary = require("./src/config/cloudinary");

cloudinary.api.ping()
  .then(() => {
    console.log("✅ Cloudinary connected successfully");
  })
  .catch((error) => {
    console.error("❌ Cloudinary connection failed");
    console.error(error);
  });

// Route module imports
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const complaintRoutes = require("./src/routes/complaintRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const repairRoutes = require("./src/routes/repairRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const workTrackingRoutes = require("./src/routes/workTrackingRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const workerRoutes = require("./src/routes/workerRoutes");
const managerRoutes = require("./src/routes/managerRoutes");
const userRoutes = require("./src/routes/userRoutes");

// ==========================================
// 2. CONNECT TO MONGODB
// ==========================================
connectDB();

const app = express();

// ==========================================
// 3. GLOBAL MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// 4. API ROUTE MOUNTING (MODULAR ROUTES)
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/work-tracking", workTrackingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/users", userRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Smart Footpath Portal Backend Running");
});

// ==========================================
// 5. SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
