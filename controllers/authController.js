const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const {
  validateProfile,
} = require("../utils/profileValidation");
const ProfileLog = require("../models/ProfileLog");
const {
  formatGhanaPhoneNumber,
  sendVerificationSms,
} = require('../utils/smsService');
const googleClient = new OAuth2Client(
  "618201056228-nn2vu59bvflvn88jk3grohb9qmaqjpr6.apps.googleusercontent.com"
);
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const generatePasswordResetToken = (id) => {
  return jwt.sign(
    {
      id,
      purpose: "password-reset",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );
};

const generateOtp = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone number and password',
      });
    }

    const formattedPhone = formatGhanaPhoneNumber(phone);

    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Ghana phone number',
      });
    }

    const existingUser = await User.findOne({ phone: formattedPhone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists',
      });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    const user = await User.create({
      full_name,
      email: email || undefined,
      phone: formattedPhone,
      password: hashedPassword,
      role: 'passenger',
      is_phone_verified: false,
      phone_otp: otp,
      phone_otp_expires: Date.now() + 10 * 60 * 1000,
    });
console.log('REGISTER BODY:', req.body);
console.log('FORMATTED PHONE:', formattedPhone);
console.log('OTP GENERATED:', otp);
console.log('SENDING SMS NOW...');


    await sendVerificationSms({
      to: formattedPhone,
      code: otp,
    });

    console.log('SMS SENT SUCCESSFULLY');

    res.status(201).json({
      success: true,
      message: 'Account created. Verification code sent to your phone.',
      requiresVerification: true,
      phone: formattedPhone,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_phone_verified: user.is_phone_verified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and verification code',
      });
    }

    const formattedPhone = formatGhanaPhoneNumber(phone);

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (user.is_phone_verified) {
      return res.json({
        success: true,
        message: 'Phone number already verified',
        token: generateToken(user._id),
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_phone_verified: user.is_phone_verified,
        },
      });
    }

    if (!user.phone_otp || !user.phone_otp_expires) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new code.',
      });
    }

    if (user.phone_otp !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    if (user.phone_otp_expires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    user.is_phone_verified = true;
    user.phone_otp = null;
    user.phone_otp_expires = null;

    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_phone_verified: user.is_phone_verified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Phone verification failed',
      error: error.message,
    });
  }
};

exports.resendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number',
      });
    }

    const formattedPhone = formatGhanaPhoneNumber(phone);

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (user.is_phone_verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified',
      });
    }

    const otp = generateOtp();

    user.phone_otp = otp;
    user.phone_otp_expires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendVerificationSms({
      to: formattedPhone,
      code: otp,
    });

    res.json({
      success: true,
      message: 'New verification code sent successfully',
      phone: formattedPhone,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and password',
      });
    }

    const formattedPhone = formatGhanaPhoneNumber(phone);

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    if (!user.is_phone_verified) {
      const otp = generateOtp();

      user.phone_otp = otp;
      user.phone_otp_expires = Date.now() + 10 * 60 * 1000;

      await user.save();

      await sendVerificationSms({
        to: formattedPhone,
        code: otp,
      });

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        phone: user.phone,
        message: 'Please verify your phone number. A new code has been sent.',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
  id: user._id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  provider: user.provider,
  role: user.role,
  is_phone_verified: user.is_phone_verified,
},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

exports.createDriver = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide driver name, phone number and password',
      });
    }

    const formattedPhone = formatGhanaPhoneNumber(phone);

    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Ghana phone number',
      });
    }

    const existingUser = await User.findOne({ phone: formattedPhone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this phone number already exists',
      });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Driver with this email already exists',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await User.create({
      full_name,
      email: email || undefined,
      phone: formattedPhone,
      password: hashedPassword,
      role: 'driver',
      is_phone_verified: true,
    });

    res.status(201).json({
      success: true,
      message: 'Driver account created successfully',
      driver: {
        _id: driver._id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        is_phone_verified: driver.is_phone_verified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: error.message,
    });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select(
      'full_name email phone role is_active is_phone_verified createdAt'
    );

    res.json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message,
    });
  }
};
exports.deleteMyAccount = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for deleting your account',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.is_active = false;
    user.is_deleted = true;
    user.deleted_at = new Date();
    user.delete_reason = reason.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Your account deletion request has been completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message,
    });
  }
};
exports.savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message: 'Expo push token is required',
      });
    }

    req.user.expo_push_token = expoPushToken;
    await req.user.save();

    res.json({
      success: true,
      message: 'Push token saved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save push token',
      error: error.message,
    });
  }
};
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google token is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience:
        "618201056228-nn2vu59bvflvn88jk3grohb9qmaqjpr6.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();

    const {
      sub,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!email_verified) {
      return res.status(401).json({
        message: "Google account is not verified",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        full_name: name,
        email,
        password: "",
        phone: undefined,
        provider: "google",
        google_id: sub,
        role: "passenger",
        is_phone_verified: true,
      });
    } else {
      if (!user.google_id) {
        user.google_id = sub;
        user.provider = "google";
        await user.save();
      }
    }

   const token = generateToken(user._id);
   
return res.json({
  success: true,
  message: "Google login successful",
  token,
  user: {
    id: user._id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    provider: user.provider,
    role: user.role,
    is_phone_verified: user.is_phone_verified,
  },
});
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Google login failed",
    });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const correctPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!correctPassword) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      12
    );

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error.",
    });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === "admin") {
  return res.status(403).json({
    success: false,
    message:
      "Admin profiles cannot be edited here.",
  });
}
const validationErrors =
  validateProfile(req.body, user);

if (
  Object.keys(validationErrors)
    .length > 0
) {
  return res.status(400).json({
    success: false,
    errors: validationErrors,
  });
}
    const {
      full_name,
      email,
      phone,
      region,
      city,
      emergency_name,
      emergency_phone,
      driver_license,
      vehicle_model,
      vehicle_color,
      plate_number,
    } = req.body;

    // -------------------------
    // Full Name
    // -------------------------
    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Full name is required.",
        });
      }

      user.full_name = full_name.trim();
    }

   // -------------------------
// Phone Number
// -------------------------
if (phone !== undefined) {
  const formattedPhone =
    formatGhanaPhoneNumber(phone);

  if (!formattedPhone) {
    return res.status(400).json({
      success: false,
      errors: {
        phone:
          "Please enter a valid Ghana phone number.",
      },
    });
  }

  const existingPhone =
    await User.findOne({
      phone: formattedPhone,
      _id: { $ne: user._id },
    });

  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message:
        "Phone number is already in use.",
    });
  }

  user.phone = formattedPhone;
}

    // -------------------------
    // Email
    // -------------------------
if (email !== undefined) {

  if (user.provider === "google") {
    return res.status(403).json({
      success: false,
      message:
        "Google email cannot be changed.",
    });
  }

  const cleanedEmail = email
    .trim()
    .toLowerCase();

  const existingEmail =
    await User.findOne({
      email: cleanedEmail,
      _id: { $ne: user._id },
    });

  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message:
        "Email address is already in use.",
    });
  }

  user.email = cleanedEmail;
}
    // -------------------------
    // Address
    // -------------------------
    if (region !== undefined)
      user.region = region.trim();

    if (city !== undefined)
      user.city = city.trim();

    // -------------------------
    // Emergency Contact
    // -------------------------
    if (emergency_name !== undefined)
      user.emergency_name =
        emergency_name.trim();

    if (emergency_phone !== undefined)
      user.emergency_phone =
        emergency_phone.trim();

    // -------------------------
    // Driver Information
    // -------------------------
    if (user.role === "driver") {
      if (driver_license !== undefined)
        user.driver_license =
          driver_license.trim();

      if (vehicle_model !== undefined)
        user.vehicle_model =
          vehicle_model.trim();

      if (vehicle_color !== undefined)
        user.vehicle_color =
          vehicle_color.trim();

      if (plate_number !== undefined)
        user.plate_number =
          plate_number
            .trim()
            .toUpperCase();
    }
const modified =
  user.modifiedPaths();

if (modified.length === 0) {
  return res.status(200).json({
    success: true,
    message:
      "No changes detected.",
    user,
  });
}
    await user.save();
await ProfileLog.create({
  user: user._id,
  changes: user.modifiedPaths(),
});
    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to update profile.",
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const formattedPhone =
      formatGhanaPhoneNumber(phone);

    const user = await User.findOne({
      phone: formattedPhone,
      is_deleted: false,
    });

    // Don't reveal whether the account exists
    if (!user) {
      return res.json({
        success: true,
        message:
          "If the phone number exists, a verification code has been sent.",
      });
    }

    const otp = generateOtp();

    user.reset_password_otp = otp;
    user.reset_password_otp_expires =
      Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendVerificationSms({
      to: formattedPhone,
      code: otp,
    });

    res.json({
      success: true,
      message:
        "Verification code sent successfully.",
      phone: formattedPhone,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to process request.",
    });
  }
};
exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const formattedPhone =
      formatGhanaPhoneNumber(phone);

    const user = await User.findOne({
      phone: formattedPhone,
    });

    if (
      !user ||
      !user.reset_password_otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    if (
      user.reset_password_otp_expires <
      Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired.",
      });
    }

    if (
      user.reset_password_otp !== code
    ) {
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code.",
      });
    }

 const resetToken =
  generatePasswordResetToken(user._id);

res.json({
  success: true,
  message: "OTP verified.",
  resetToken,
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Verification failed.",
    });
  }
};


exports.resetPassword = async (
  req,
  res
) => {
  try {
    const {
      resetToken,
      password,
      confirmPassword,
    } = req.body;

    if (
      !resetToken ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required.",
      });
    }

    if (
      password !== confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message:
          "Reset session expired.",
      });
    }

    if (
      decoded.purpose !==
      "password-reset"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const user =
      await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Account not found.",
      });
    }

    user.password =
      await bcrypt.hash(password, 12);

    user.reset_password_otp = null;
    user.reset_password_otp_expires =
      null;

    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to reset password.",
    });
  }
};