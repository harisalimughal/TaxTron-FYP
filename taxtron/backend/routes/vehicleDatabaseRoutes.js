const express = require('express');
const VehicleDatabase = require('../models/vehicleDatabase');

const router = express.Router();

// GET: Fetch vehicle details by chassis number
router.get('/vehicle-details/:chassisNumber', async (req, res) => {
  try {
    const { chassisNumber } = req.params;
    
    if (!chassisNumber) {
      return res.status(400).json({
        success: false,
        message: 'Chassis number is required'
      });
    }
    
    const vehicle = await VehicleDatabase.findOne({ 
      chassisNumber: chassisNumber.toUpperCase(),
      isActive: true 
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found in database',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vehicle details fetched successfully',
      data: {
        chassisNumber: vehicle.chassisNumber,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant,
        year: vehicle.year,
        engineNumber: vehicle.engineNumber,
        engineCapacity: vehicle.engineCapacity,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        color: vehicle.color,
        bodyType: vehicle.bodyType,
        seatingCapacity: vehicle.seatingCapacity,
        length: vehicle.length,
        width: vehicle.width,
        height: vehicle.height,
        wheelbase: vehicle.wheelbase,
        power: vehicle.power,
        torque: vehicle.torque,
        topSpeed: vehicle.topSpeed,
        acceleration: vehicle.acceleration,
        safetyFeatures: vehicle.safetyFeatures,
        countryOfOrigin: vehicle.countryOfOrigin,
        manufacturer: vehicle.manufacturer,
        vehicleCategory: vehicle.vehicleCategory,
        basePrice: vehicle.basePrice,
        taxRate: vehicle.taxRate
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle details',
      error: error.message
    });
  }
});

// GET: Search vehicles by make, model, or year (for suggestions)
router.get('/search', async (req, res) => {
  try {
    const { make, model, year, limit = 10 } = req.query;
    
    const filter = { isActive: true };
    
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (year) filter.year = parseInt(year);
    
    const vehicles = await VehicleDatabase.find(filter)
      .select('chassisNumber make model variant year color')
      .limit(parseInt(limit))
      .sort({ make: 1, model: 1, year: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Vehicles found',
      data: vehicles
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching vehicles',
      error: error.message
    });
  }
});

// POST: Add new vehicle to database (admin only)
router.post('/add-vehicle', async (req, res) => {
  try {
    const vehicleData = req.body;
    
    // Check if vehicle already exists
    const existingVehicle = await VehicleDatabase.findOne({ 
      chassisNumber: vehicleData.chassisNumber 
    });
    
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this chassis number already exists'
      });
    }
    
    const vehicle = new VehicleDatabase(vehicleData);
    await vehicle.save();
    
    res.status(201).json({
      success: true,
      message: 'Vehicle added to database successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding vehicle',
      error: error.message
    });
  }
});

// GET: Get all vehicle makes (for dropdown)
router.get('/makes', async (req, res) => {
  try {
    const makes = await VehicleDatabase.distinct('make', { isActive: true });
    
    res.status(200).json({
      success: true,
      message: 'Vehicle makes fetched successfully',
      data: makes.sort()
    });
  } catch (error) {
    console.error('Error fetching makes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching makes',
      error: error.message
    });
  }
});

// GET: Get models by make
router.get('/models/:make', async (req, res) => {
  try {
    const { make } = req.params;
    
    const models = await VehicleDatabase.distinct('model', { 
      make: new RegExp(make, 'i'),
      isActive: true 
    });
    
    res.status(200).json({
      success: true,
      message: 'Vehicle models fetched successfully',
      data: models.sort()
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching models',
      error: error.message
    });
  }
});

module.exports = router;
