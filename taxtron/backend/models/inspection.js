const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
    inspectionId: {
      type: String,
      required: true,
      unique: true
    },
    walletAddress: {
      type: String,
      required: true
    },
    vehicleDetails: {
      ownerName: String,
      fatherName: String,
      cnic: String,
      engineNumber: {
        type: String,
        required: true
      },
      chassisNumber: {
        type: String,
        required: true
      },
      make: String,
      model: String,
      variant: String,
      manufacturingYear: Number,
      registrationYear: Number,
      vehicleType: String,
      fuelType: String
    },
    appointmentDetails: {
      date: String,
      time: String,
      appointmentId: String
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    registrationNumber: {
      type: String,
      default: null
    },
    inspectionNotes: {
      type: String,
      default: ''
    },
    inspectedBy: {
      type: String,
      default: null
    },
    inspectionDate: {
      type: Date,
      default: null
    },

    vehicleImage: {
    type: String,
    default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    // Payment related fields
  isPaid: {
    type: Boolean,
    default: false
  },
  transactionHash: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: null
  },
  payerWallet: {
    type: String,
    default: ''
  },
  
  // Fee related fields (you can add these to vehicleDetails or as separate fields)
  regFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalFee: {
    type: Number,
    default: 0
  },

  });
  
 
  module.exports = mongoose.model('Inspection', inspectionSchema);