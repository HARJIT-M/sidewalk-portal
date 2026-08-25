const express = require("express");

const router = express.Router();

const {
    getWorkers,
    getAvailableWorkers
} = require("../controllers/workercontroller");

router.get("/", getWorkers);

router.get("/available", getAvailableWorkers);

module.exports = router;