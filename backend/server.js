const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintroutes");
const workerRoutes = require("./routes/workerroutes");
const dashboardRoutes = require("./routes/dashboardroutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/complaints", complaintRoutes);

app.use("/api/workers", workerRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.send("Digital Footpath Inspection and Repair Portal API Running...");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});