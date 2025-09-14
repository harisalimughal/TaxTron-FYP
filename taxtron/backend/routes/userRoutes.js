const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticateUser, verifyOwnership, requireVerification } = require('../middleware/userAuth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { cnic, fullName, fatherName, phoneNumber, email, walletAddress, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { cnic },
        { email },
        { walletAddress }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this CNIC, email, or wallet address'
      });
    }

    // Create new user
    const user = new User({
      cnic,
      fullName,
      fatherName,
      phoneNumber,
      email,
      walletAddress,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please complete verification.',
      data: {
        user: {
          id: user._id,
          cnic: user.cnic,
          fullName: user.fullName,
          email: user.email,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified
        },
        token
      }
    });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          cnic: user.cnic,
          fullName: user.fullName,
          email: user.email,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified
        },
        token
      }
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', authenticateUser, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        cnic: req.user.cnic,
        fullName: req.user.fullName,
        fatherName: req.user.fatherName,
        phoneNumber: req.user.phoneNumber,
        email: req.user.email,
        walletAddress: req.user.walletAddress,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt
      }
    }
  });
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { fullName, fatherName, phoneNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (fatherName) user.fatherName = fatherName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          cnic: user.cnic,
          fullName: user.fullName,
          fatherName: user.fatherName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message
    });
  }
});

// Verify user account (Admin only)
router.put('/verify/:userId', authenticateUser, async (req, res) => {
  try {
    // This should be admin-only in production
    const { userId } = req.params;
    const { verificationMethod } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = true;
    user.verificationMethod = verificationMethod || 'Manual';
    user.verifiedAt = new Date();
    user.verifiedBy = req.user._id;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      data: {
        user: {
          id: user._id,
          cnic: user.cnic,
          fullName: user.fullName,
          isVerified: user.isVerified,
          verifiedAt: user.verifiedAt
        }
      }
    });

  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      error: error.message
    });
  }
});



// Check if wallet address is already registered
router.get('/check-wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findOne({ walletAddress });
    
    res.status(200).json({
      success: true,
      exists: !!user,
      data: user ? {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isVerified: user.isVerified
      } : null
    });
  } catch (error) {
    console.error('Error checking wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking wallet',
      error: error.message
    });
  }
});

module.exports = router;
