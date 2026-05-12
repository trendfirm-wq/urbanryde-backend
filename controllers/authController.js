const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  formatGhanaPhoneNumber,
  sendVerificationSms,
} = require('../utils/smsService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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