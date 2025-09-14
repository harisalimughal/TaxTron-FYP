const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
    inspectionId: {
      type: String,
      required: true,
      unique: true
    },
    
    // User Reference (instead of wallet address)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Vehicle Details (no owner info here - it's in User model)
    vehicleDetails: {
      engineNumber: {
        type: String,
        required: true,
        unique: true // Prevent duplicate engine numbers
      },
      chassisNumber: {
        type: String,
        required: true,
        unique: true // Prevent duplicate chassis numbers
      },
      make: {
        type: String,
        required: true
      },
      model: {
        type: String,
        required: true
      },
      variant: String,
      manufacturingYear: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
      },
      registrationYear: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
      },
      vehicleType: {
        type: String,
        required: true,
        enum: ['Car', 'Motorcycle', 'Truck', 'Bus', 'Van', 'SUV', 'Other']
      },
      fuelType: {
        type: String,
        required: true,
        enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other']
      },
      engineCapacity: {
        type: Number,
        required: true,
        min: 0
      },
      color: {
        type: String,
        required: true
      }
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

  // Tax payment specific fields
  taxPaid: {
    type: Boolean,
    default: false
  },
  taxTransactionHash: {
    type: String,
    default: ''
  },
  taxPaymentDate: {
    type: Date,
    default: null
  },
  taxPayerWallet: {
    type: String,
    default: ''
  },
  taxAmount: {
    type: Number,
    default: 0
  },

  });
  
 
  module.exports = mongoose.model('Inspection', inspectionSchema);