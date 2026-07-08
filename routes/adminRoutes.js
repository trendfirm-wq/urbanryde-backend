const express = require("express");

const {
  getDashboard,
} = require("../controllers/adminController");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("admin"),
  getDashboard
);

module.exports = router;