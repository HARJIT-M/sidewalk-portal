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
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User role not defined.",
      });
    }

    const currentRole = req.user.role.toUpperCase();

    // If role matches allowed list OR user is MANAGER (manager has supervisor privilege)
    if (allowedRoles.includes(currentRole) || currentRole === "MANAGER") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You do not have permission to access this resource. Allowed roles: ${allowedRoles.join(", ")}`,
    });
  };
};

module.exports = {
  protect,
  authorize,
};