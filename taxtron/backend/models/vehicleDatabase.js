const mongoose = require('mongoose');

// Vehicle database for auto-fetching details by chassis number
const vehicleDatabaseSchema = new mongoose.Schema({
  chassisNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Vehicle Information
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  
  // Technical Specifications
  engineNumber: {
    type: String,
    required: true
  },
  engineCapacity: {
    type: Number,
    required: true // in CC
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other']
  },
  transmission: {
    type: String,
    required: true,
    enum: ['Manual', 'Automatic', 'CVT', 'Semi-Automatic']
  },
  
  // Physical Specifications
  color: {
    type: String,
    required: true
  },
  bodyType: {
    type: String,
    required: true,
    enum: ['Sedan', 'Hatchback', 'SUV', 'MUV', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Bus', 'Truck', 'Motorcycle', 'Scooter', 'Other']
  },
  seatingCapacity: {
    type: Number,
    required: true
  },
  
  // Dimensions
  length: Number, // in mm
  width: Number,  // in mm
  height: Number, // in mm
  wheelbase: Number, // in mm
  
  // Performance
  power: Number, // in HP
  torque: Number, // in Nm
  topSpeed: Number, // in km/h
  acceleration: Number, // 0-100 km/h in seconds
  
  // Safety Features
  safetyFeatures: [{
    type: String,
    enum: ['ABS', 'Airbags', 'EBD', 'ESP', 'TCS', 'Hill Assist', 'Parking Sensors', 'Reverse Camera', 'Lane Assist', 'Blind Spot Monitor', 'Other']
  }],
  
  // Additional Information
  countryOfOrigin: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  vehicleCategory: {
    type: String,
    required: true,
    enum: ['Passenger Vehicle', 'Commercial Vehicle', 'Two Wheeler', 'Three Wheeler', 'Heavy Vehicle']
  },
  
  // Tax Information (for automatic calculation)
  basePrice: {
    type: Number,
    required: true // in PKR
  },
  taxRate: {
    type: Number,
    required: true // percentage
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster searchevehicleDatabaseSchema.index({ make: 1, model: 1 });
vehicleDatabaseSchema.index({ year: 1 });

module.exports = mongoose.model('VehicleDatabase', vehicleDatabaseSchema);
