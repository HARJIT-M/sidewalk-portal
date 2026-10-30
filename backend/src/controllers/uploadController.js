const { ComplaintImage, Complaint, RepairHistory } = require("../schemas");

// ==========================================
// 1. UPLOAD REPAIR PROOF (BEFORE / AFTER)
// ==========================================
const uploadRepairProof = async (req, res) => {
  try {
    const { complaintId, imageUrl, imageType } = req.body;

    if (!complaintId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Both complaintId and imageUrl are required.",
      });
    }

    // 1. Find Complaint
    let complaint;
    if (complaintId.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(complaintId);
    } else {
      complaint = await Complaint.findOne({ complaint_code: complaintId });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const type = (imageType || "BEFORE").toUpperCase() === "AFTER" ? "AFTER" : "BEFORE";

    // 2. Create ComplaintImage record
    const newImage = await ComplaintImage.create({
      complaint_id: complaint._id,
      image_url: imageUrl,
      image_type: type,
      uploaded_at: new Date(),
      uploaded_by: req.user._id,
    });

    // 3. Sync with RepairHistory
    let repairHistory = await RepairHistory.findOne({ complaint_id: complaint._id });
    if (repairHistory) {
      if (type === "BEFORE") {
        repairHistory.before_image = imageUrl;
      } else {
        repairHistory.after_image = imageUrl;
      }
      await repairHistory.save();
    }

    // 4. Update Complaint primary image if empty
    if (!complaint.image_url) {
      complaint.image_url = imageUrl;
      await complaint.save();
    }

    return res.status(201).json({
      success: true,
      message: `${type} repair proof photo uploaded successfully.`,
      image: {
        id: newImage._id,
        complaintId: complaint.complaint_code,
        imageUrl: newImage.image_url,
        imageType: newImage.image_type,
        uploadedAt: newImage.uploaded_at,
      },
    });
  } catch (error) {
    console.error("Error uploading repair proof:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading repair proof.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET COMPLAINT IMAGES & PROOF
// ==========================================
const getComplaintImages = async (req, res) => {
  try {
    const { complaintId } = req.params;

    let complaint;
    if (complaintId.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(complaintId);
    } else {
      complaint = await Complaint.findOne({ complaint_code: complaintId });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const images = await ComplaintImage.find({ complaint_id: complaint._id })
      .populate("uploaded_by", "name role")
      .sort({ uploaded_at: 1 });

    const beforeImages = images.filter((img) => img.image_type === "BEFORE");
    const afterImages = images.filter((img) => img.image_type === "AFTER");

    return res.status(200).json({
      success: true,
      count: images.length,
      complaintCode: complaint.complaint_code,
      beforeImages,
      afterImages,
      allImages: images,
    });
  } catch (error) {
    console.error("Error fetching complaint images:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching complaint images.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. DELETE UPLOADED PROOF / IMAGE
// ==========================================
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ComplaintImage.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    await ComplaintImage.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Image successfully deleted.",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting image.",
      error: error.message,
    });
  }
};

module.exports = {
  uploadRepairProof,
  getComplaintImages,
  deleteImage,
};
