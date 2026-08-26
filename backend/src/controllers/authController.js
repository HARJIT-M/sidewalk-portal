const authService = require("../services/authService");

const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = await authService.createUser({ name, email, password, phone });
    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.authenticateUser({ email, password });
    res.json({ message: "Authenticated", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

    const token = (authHeader || "").split(" ")[1];
    const payload = await authService.verifyToken(token);
    res.json({ valid: true, payload });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
};

module.exports = { signup, login, verifyToken };
