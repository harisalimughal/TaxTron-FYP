const mongoose = require('mongoose');

const ownershipTransferSchema = new mongoose.Schema({
  transferId: {
    type: String,
    required: true,
    unique: true,
    default: () => `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  vehicleId: {
    type: String,
    required: true,
    ref: 'Inspection'
  },
  chassisNumber: {
    type: String,
    required: true
  },
  fromOwner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    fullName: {
      type: String,
      required: true
    },
    cnic: {
      type: String,
      required: true
    },
    walletAddress: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  toOwner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    fullName: {
      type: String,
      required: true
    },
    cnic: {
      type: String,
      required: true
    },
    walletAddress: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  transferDate: {
    type: Date,
    default: Date.now
  },
  transferFee: {
    type: Number,
    required: true,
    default: 5000 // Default transfer fee in PKR
  },
  status: {
    type: String,
    enum: ['pending_admin_approval', 'approved', 'completed', 'rejected', 'cancelled'],
    default: 'pending_admin_approval'
  },
  blockchainTxHash: {
    type: String,
    default: ''
  },
  transferDeed: {
    type: String, // Base64 encoded PDF
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ownershipTransferSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('OwnershipTransfer', ownershipTransferSchema);
