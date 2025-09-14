const mongoose = require('mongoose');

const ownershipHistorySchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    ref: 'Inspection'
  },
  chassisNumber: {
    type: String,
    required: true
  },
  ownershipHistory: [{
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    ownerName: {
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
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null // null means current owner
    },
    transferType: {
      type: String,
      enum: ['registration', 'transfer'],
      required: true
    },
    transferId: {
      type: String,
      ref: 'OwnershipTransfer',
      default: null
    },
    isCurrentOwner: {
      type: Boolean,
      default: false
    }
  }],
  totalTransfers: {
    type: Number,
    default: 0
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
ownershipHistorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
ownershipHistorySchema.index({ vehicleId: 1 });
ownershipHistorySchema.index({ chassisNumber: 1 });

module.exports = mongoose.model('OwnershipHistory', ownershipHistorySchema);
