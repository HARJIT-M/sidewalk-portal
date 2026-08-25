const Complaint = require("../models/complaint");

const getDashboardStats = async (req, res) => {
    try {

        const totalComplaints = await Complaint.countDocuments();

        const pending = await Complaint.countDocuments({
            status: "Pending"
        });

        const assigned = await Complaint.countDocuments({
            status: "Assigned"
        });

        const completed = await Complaint.countDocuments({
            status: "Completed"
        });

        res.status(200).json({
            success: true,
            totalComplaints,
            pending,
            assigned,
            completed
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    getDashboardStats
};