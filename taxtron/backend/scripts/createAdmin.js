const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taxtron');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Create admin account
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Email: admin');
      console.log('Password: 12345678');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      email: 'admin',
      password: '12345678' // Will be hashed by the pre-save middleware
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('Email: admin');
    console.log('Password: 12345678');
    console.log('\nYou can now login to the admin panel using these credentials.');
    
  } catch (error) {
    console.error('Error creating admin account:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(() => {
  createAdmin();
});
