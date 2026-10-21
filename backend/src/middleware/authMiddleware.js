const jwt = require("jsonwebtoken");
const User = require("../schemas/User");

// ==========================================
// 1. JWT AUTHENTICATION MIDDLEWARE
// ==========================================
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status && user.status.toUpperCase() !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ==========================================
// 2. ROLE AUTHORIZATION MIDDLEWARE
// ==========================================
const authorize = (...roles) => {
  const allowedRoles = roles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(String(req.user.role).toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    return next();
  };
};

module.exports = {
  protect,
  authorize,
};