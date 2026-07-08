const express = require("express");

const {
  getAllDrivers,
  deleteDriver,
} = require("../controllers/driverController");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getAllDrivers
);
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteDriver
);
module.exports = router;