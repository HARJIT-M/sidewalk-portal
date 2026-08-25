const Complaint = require("../models/complaint");

// Create Complaint
const createComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.create(req.body);

        res.status(201).json({
            success: true,
            message: "Complaint Created Successfully",
            complaint
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// Get All Complaints

const getComplaints = async (req, res) => {

    try {

        const complaints = await Complaint.find();

        res.status(200).json({
            success: true,
            complaints
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// Get Complaint By ID

const getComplaintById = async (req, res) => {
    try {

        const complaint = await Complaint.findById(req.params.id)
            .populate("assignedWorker")
            .populate("assignedManager");

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            success: true,
            complaint
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const Worker = require("../models/worker");

const assignWorker = async (req, res) => {

    try {

        const { complaintId, workerId } = req.body;

        const complaint = await Complaint.findById(complaintId);

        const worker = await Worker.findById(workerId);

        if (!complaint || !worker) {
            return res.status(404).json({
                success: false,
                message: "Complaint or Worker not found"
            });
        }

        complaint.assignedWorker = worker._id;
        complaint.status = "Assigned";

        worker.availability = "Busy";

        await complaint.save();

        await worker.save();

        res.status(200).json({
            success: true,
            message: "Worker Assigned Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    assignWorker
};