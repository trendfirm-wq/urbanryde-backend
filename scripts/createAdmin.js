const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const phone = '233558099243';
    const email = 'admin@urbanryde.com';
    const password = 'admin123';

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.findOneAndUpdate(
      { email },
      {
        full_name: 'UrbanRyde Admin',
        email,
        phone,
        password: hashedPassword,
        role: 'admin',
        is_active: true,
        is_phone_verified: true,
        phone_otp: null,
        phone_otp_expires: null,
      },
      { new: true, upsert: true }
    );

    console.log('Admin created/updated successfully:', {
      id: admin._id,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error('Create admin error:', error.message);
    process.exit(1);
  }
};

createAdmin();