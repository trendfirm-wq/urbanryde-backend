const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
  phone: '0200000000',
  role: 'admin',
});

    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

   await User.create({
  full_name: 'UrbanRyde Admin',
  phone: '0200000000',
  password: hashedPassword,
  role: 'admin',
  is_phone_verified: true,
});

    console.log('Admin created successfully');
    console.log('Email: admin@urbanryde.com');
    console.log('Password: admin123');

    process.exit();
  } catch (error) {
    console.error('Create admin error:', error.message);
    process.exit(1);
  }
};

createAdmin();