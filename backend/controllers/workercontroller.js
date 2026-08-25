const Worker = require("../models/worker");

const getWorkers = async (req, res) => {

    try {

        const workers = await Worker.find();

        res.status(200).json({
            success: true,
            workers
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getAvailableWorkers = async (req, res) => {

    try {

        const workers = await Worker.find({
            availability: "Available"
        });

        res.status(200).json({
            success: true,
            workers
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    getWorkers,
    getAvailableWorkers
};