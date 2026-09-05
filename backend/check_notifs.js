const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const { Notification, User } = require("./src/schemas");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: [path.resolve(__dirname, ".env"), path.resolve(__dirname, "src/.env")] });

async function check() {
  await connectDB();
  const notifs = await Notification.find().populate("user_id", "name email role");
  console.log("NOTIFICATIONS IN DB:", JSON.stringify(notifs, null, 2));

  const users = await User.find();
  console.log("USERS:", users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
  
  process.exit(0);
}

check();
