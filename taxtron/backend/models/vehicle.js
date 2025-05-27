const mongoose = require('mongoose');
const vehicleSchema = new mongoose.Schema({
    registrationNumber: String,
    ownerName: String,
    isVerified: { type: Boolean, default: false },
    inspection: {
      imageUrl: String,
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      notes: String,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      date: Date
    }
  });
  
  module.exports = mongoose.model('Vehicle', vehicleSchema);
  