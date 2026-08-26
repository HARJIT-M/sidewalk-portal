const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../schemas/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

async function createUser({ name, email, password, phone }) {
  if (!email || !password || !name) throw new Error("name, email and password are required");

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already in use");

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = new User({ name, email, password: hash, phone });
  await user.save();
  return user;
}

async function authenticateUser({ email, password }) {
  if (!email || !password) throw new Error("email and password required");
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user, token };
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = { createUser, authenticateUser, verifyToken };
