const express = require('express');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 📌 Create Admin (Temporary endpoint for setup)
router.post('/create', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin account already exists' });
    }

    // Create new admin
    const admin = new Admin({
      email,
      password
    });

    await admin.save();
    res.json({ message: 'Admin account created successfully', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, adminId: admin._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Admin Profile
router.get('/profile', async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({ message: 'Admin profile endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Update Admin Profile
router.put('/profile', async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({ message: 'Admin profile update endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Get Admin Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // This would require admin authentication middleware
    // For now, just return a placeholder
    res.json({ 
      message: 'Admin dashboard stats endpoint',
      stats: {
        totalInspections: 0,
        pendingInspections: 0,
        approvedInspections: 0,
        rejectedInspections: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
