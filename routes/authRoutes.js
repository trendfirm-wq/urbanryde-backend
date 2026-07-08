const express = require('express');

const {
  register,
  login,
  googleLogin,
  me,
  createDriver,
  getAllDrivers,
  verifyPhoneOtp,
  resendPhoneOtp,
  deleteMyAccount,
  savePushToken,
  changePassword,
  updateProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-reset-otp",
  verifyResetOtp
);

router.post(
  "/reset-password",
  resetPassword
);
router.post(
  "/google",
  (req, res, next) => {
    console.log("🔥 GOOGLE ROUTE HIT");
    console.log(req.body);
    next();
  },
  googleLogin
);
router.patch(
  "/change-password",
  protect,
  changePassword
);
router.patch(
  "/update-profile",
  protect,
  updateProfile
);
router.post('/verify-phone', verifyPhoneOtp);
router.post('/resend-otp', resendPhoneOtp);
router.patch('/delete-account', protect, deleteMyAccount);
router.patch('/save-push-token', protect, savePushToken);

router.get('/me', protect, me);

router.post('/create-driver', protect, allowRoles('admin'), createDriver);
router.get('/drivers', protect, allowRoles('admin'), getAllDrivers);

module.exports = router;