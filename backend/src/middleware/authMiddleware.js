const authService = require("../services/authService");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

    const token = (authHeader || "").split(" ")[1];
    const payload = await authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authenticate };
