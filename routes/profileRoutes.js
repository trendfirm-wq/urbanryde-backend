// routes/profileRoutes.js

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getProfileDashboard } = require("../controllers/profileController");

const router = express.Router();

router.get("/dashboard", protect, getProfileDashboard);

module.exports = router;