const User = require("../models/User");

exports.getAllDrivers = async (
  req,
  res
) => {
  try {

    const drivers =
      await User.find({
        role: "driver",
      })
      .select(
        "full_name phone email createdAt"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: drivers.length,
      drivers,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    await driver.deleteOne();

    res.json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};