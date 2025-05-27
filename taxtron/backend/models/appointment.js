const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['Free', 'Booked'], default: 'Free' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
