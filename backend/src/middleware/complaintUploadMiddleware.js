const multer = require("multer");

const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      const error = new Error("Only image files are allowed.");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

const uploadComplaintImages = (req, res, next) => {
  upload.array("images", 10)(req, res, (error) => {
    if (!error) return next();

    const status =
      error.code === "LIMIT_FILE_SIZE"
        ? 413
        : error.code === "LIMIT_FILE_COUNT" ||
            error.code === "LIMIT_UNEXPECTED_FILE"
          ? 400
          : error.status || 400;

    return res.status(status).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 10 MB or smaller."
          : error.message || "Unable to upload complaint images.",
    });
  });
};

module.exports = uploadComplaintImages;
