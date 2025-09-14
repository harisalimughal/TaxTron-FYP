const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Primary Identity
  cnic: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // CNIC format: 35202-1234567-8 (5-7-1 digits)
        return /^\d{5}-\d{7}-\d$/.test(v);
      },
      message: 'CNIC must be in format: 35202-1234567-8'
    }
  },
  
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Contact Information
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Pakistani phone number format
        return /^(\+92|0)?[0-9]{10}$/.test(v);
      },
      message: 'Phone number must be valid Pakistani format'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email must be valid'
    }
  },
  
  // Blockchain Integration
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Wallet address must be valid Ethereum address'
    }
  },
  
  // Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['CNIC', 'Biometric', 'Manual'],
    default: 'CNIC'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Security
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// Password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
