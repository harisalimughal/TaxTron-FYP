const express = require('express');
const Inspection = require('../models/inspection');
const User = require('../models/user');
const { authenticateUser, requireVerification } = require('../middleware/userAuth');

const router = express.Router();

// Submit vehicle inspection request (requires authentication only)
// This route handles vehicle registration which creates an inspection request
router.post('/register', authenticateUser, async (req, res) => {
  try {
    const { vehicleDetails, appointmentDetails } = req.body;
    const userId = req.user._id;

    // Check if engine number already exists
    const existingEngine = await Inspection.findOne({ 
      'vehicleDetails.engineNumber': vehicleDetails.engineNumber 
    });
    if (existingEngine) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this engine number is already registered'
      });
    }

    // Check if chassis number already exists
    const existingChassis = await Inspection.findOne({ 
      'vehicleDetails.chassisNumber': vehicleDetails.chassisNumber 
    });
    if (existingChassis) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this chassis number is already registered'
      });
    }

    // Generate unique inspection ID
    const inspectionId = `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create inspection record
    const inspection = new Inspection({
      inspectionId,
      userId,
      vehicleDetails,
      appointmentDetails,
      status: 'Pending'
    });

    await inspection.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle registration request submitted successfully',
      data: {
        inspectionId: inspection.inspectionId,
        status: inspection.status,
        vehicleDetails: inspection.vehicleDetails,
        appointmentDetails: inspection.appointmentDetails
      }
    });

  } catch (error) {
    console.error('Vehicle registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during vehicle registration',
      error: error.message
    });
  }
});

// Alternative route name for inspection submission (same functionality as /register)
router.post('/inspection-request', authenticateUser, async (req, res) => {
  try {
    const { vehicleDetails, appointmentDetails } = req.body;
    const userId = req.user._id;

    // Check if engine number already exists
    const existingEngine = await Inspection.findOne({ 
      'vehicleDetails.engineNumber': vehicleDetails.engineNumber 
    });
    if (existingEngine) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this engine number is already registered'
      });
    }

    // Check if chassis number already exists
    const existingChassis = await Inspection.findOne({ 
      'vehicleDetails.chassisNumber': vehicleDetails.chassisNumber 
    });
    if (existingChassis) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this chassis number is already registered'
      });
    }

    // Generate unique inspection ID
    const inspectionId = `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create inspection record
    const inspection = new Inspection({
      inspectionId,
      userId,
      vehicleDetails,
      appointmentDetails,
      status: 'Pending'
    });

    await inspection.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle inspection request submitted successfully',
      data: {
        inspectionId: inspection.inspectionId,
        status: inspection.status,
        vehicleDetails: inspection.vehicleDetails,
        appointmentDetails: inspection.appointmentDetails
      }
    });

  } catch (error) {
    console.error('Vehicle inspection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during inspection request submission',
      error: error.message
    });
  }
});

// Get user's vehicles
router.get('/my-vehicles', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const inspections = await Inspection.find({ userId })
      .populate('userId', 'fullName cnic email walletAddress')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });

  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicles',
      error: error.message
    });
  }
});

// Get vehicles for tax payment (approved vehicles only)
router.get('/tax-payment', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const inspections = await Inspection.find({ 
      userId,
      status: 'Approved' 
    }).populate('userId', 'fullName cnic walletAddress')
      .sort({ createdAt: -1 });

    // Process vehicles for tax calculation
    const vehiclesWithTaxData = inspections.map(inspection => {
      const vehicle = inspection.vehicleDetails;
      const user = inspection.userId;
      
      console.log(`Processing vehicle ${inspection.inspectionId}: isPaid = ${inspection.isPaid}`);
      
      return {
        inspectionId: inspection.inspectionId,
        registrationNumber: inspection.registrationNumber || 'Pending',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.manufacturingYear,
        vehicleType: vehicle.vehicleType,
        engineCapacity: vehicle.engineCapacity,
        color: vehicle.color,
        chassisNumber: vehicle.chassisNumber,
        owner: {
          name: user.fullName,
          cnic: user.cnic,
          walletAddress: user.walletAddress
        },
        registrationFeePaid: inspection.isPaid || false,
        taxAmount: inspection.taxAmount || 0,
        taxPaid: inspection.taxPaid || false,
        taxPaidTimestamp: inspection.taxPaymentDate ? Math.floor(inspection.taxPaymentDate.getTime() / 1000) : 0,
        registrationTimestamp: inspection.createdAt ? Math.floor(inspection.createdAt.getTime() / 1000) : 0,
        isActive: true,
        vehicleImage: inspection.vehicleImage,
        inspectionNotes: inspection.inspectionNotes
      };
    });

    res.status(200).json({
      success: true,
      count: vehiclesWithTaxData.length,
      data: vehiclesWithTaxData
    });

  } catch (error) {
    console.error('Error fetching vehicles for tax payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicles for tax payment',
      error: error.message
    });
  }
});

// Get single vehicle details
router.get('/:inspectionId', authenticateUser, async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const userId = req.user._id;

    const inspection = await Inspection.findOne({ 
      inspectionId,
      userId 
    }).populate('userId', 'fullName cnic email walletAddress');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: inspection
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

// Update tax payment status
router.post('/:inspectionId/pay-tax', authenticateUser, async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { transactionHash, taxAmount } = req.body;
    const userId = req.user._id;

    const inspection = await Inspection.findOne({ 
      inspectionId,
      userId 
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    inspection.taxPaid = true;
    inspection.taxTransactionHash = transactionHash;
    inspection.taxPaymentDate = new Date();
    inspection.taxPayerWallet = req.user.walletAddress;
    inspection.taxAmount = taxAmount;
    inspection.updatedAt = new Date();

    await inspection.save();

    res.status(200).json({
      success: true,
      message: 'Tax payment recorded successfully',
      data: {
        inspectionId: inspection.inspectionId,
        taxPaid: inspection.taxPaid,
        transactionHash: inspection.taxTransactionHash,
        paymentDate: inspection.taxPaymentDate
      }
    });

  } catch (error) {
    console.error('Error processing tax payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing tax payment',
      error: error.message
    });
  }
});

// Set tax amount for a vehicle (user function - own vehicles only)
router.post('/:inspectionId/set-tax-amount', authenticateUser, async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { taxAmount } = req.body;
    const userId = req.user._id;

    // Verify the inspection belongs to the user
    const inspection = await Inspection.findOne({ 
      inspectionId,
      userId,
      status: 'Approved',
      isPaid: true // Must have paid registration fee
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or registration fee not paid'
      });
    }

    // Update tax amount in database
    inspection.taxAmount = taxAmount;
    await inspection.save();

    res.status(200).json({
      success: true,
      message: 'Tax amount set successfully',
      data: {
        inspectionId: inspection.inspectionId,
        taxAmount: inspection.taxAmount
      }
    });

  } catch (error) {
    console.error('Error setting tax amount:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting tax amount',
      error: error.message
    });
  }
});

// Admin endpoint to set tax amount for any vehicle
router.post('/admin/:inspectionId/set-tax-amount', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { taxAmount } = req.body;

    console.log(`Admin setting tax amount for ${inspectionId}: ${taxAmount}`);

    // Find the inspection (admin can set for any vehicle)
    const inspection = await Inspection.findOne({ 
      inspectionId,
      status: 'Approved',
      isPaid: true // Must have paid registration fee
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or registration fee not paid'
      });
    }

    // Update tax amount in database
    inspection.taxAmount = taxAmount;
    await inspection.save();

    console.log(`Tax amount updated for ${inspectionId}: ${taxAmount}`);

    res.status(200).json({
      success: true,
      message: 'Tax amount set successfully by admin',
      data: {
        inspectionId: inspection.inspectionId,
        taxAmount: inspection.taxAmount,
        ownerName: inspection.userId?.fullName || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error setting tax amount (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting tax amount',
      error: error.message
    });
  }
});

module.exports = router;
