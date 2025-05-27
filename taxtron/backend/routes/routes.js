const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const Inspection = require('../models/inspection');
const Vehicle = require('../models/vehicle');
const { adminAuth } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, adminId: admin._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Create Appointment
router.post('/appointments', async (req, res) => {
  try {
    const {scheduledDate } = req.body;

    const appointment = new Appointment({
      scheduledDate
    });

    const saved = await appointment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

// 📌 Get Appointments (optionally filter by vehicleNumber)
router.get('/appointments', async (req, res) => {
  try {
    const { scheduledDate } = req.query;

    const filter = {};
    if (scheduledDate) filter.scheduledDate = scheduledDate;

    const appointments = await Appointment.find(filter);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
  }
});



// Update appointment status by ID
router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Appointment.findByIdAndUpdate(id, { status }, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Status updated', updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});


// 📌 DELETE Appointment by ID
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Appointment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully', deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
  }
});


// Inspection Routes
// Key endpoints:
// POST /api/inspections         // Submit new inspection request
// GET /api/inspections/:id      // Get inspection details by ID
// GET /api/inspections          // Get all inspections (with filters)
// PUT /api/inspections/:id/status  // Update inspection status (approve/reject)
// GET /api/inspections/wallet/:address  // Get inspections by wallet address
router.post('/inspections', async (req, res) => {
  try {
    const {
      inspectionId,
      walletAddress,
      vehicleDetails,
      appointmentDetails
    } = req.body;

    // Validate required fields
    if (!inspectionId || !walletAddress || !vehicleDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if inspection ID already exists
    const existingInspection = await Inspection.findOne({ inspectionId });
    if (existingInspection) {
      return res.status(409).json({ 
        success: false, 
        message: 'Inspection ID already exists' 
      });
    }

    // Create new inspection request
    const newInspection = new Inspection({
      inspectionId,
      walletAddress,
      vehicleDetails,
      appointmentDetails,
      status: 'Pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Save to database
    await newInspection.save();

    res.status(201).json({
      success: true,
      message: 'Inspection request submitted successfully',
      data: {
        inspectionId: newInspection.inspectionId,
        status: newInspection.status,
        appointmentDetails: newInspection.appointmentDetails
      }
    });
  } catch (error) {
    console.error('Error submitting inspection request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while submitting inspection request',
      error: error.message
    });
  }
});

// Route to get inspection details by ID
router.get('/inspections/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inspection not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching inspection',
      error: error.message
    });
  }
});

// Route to get all inspections (with optional filters)
router.get('/inspections', async (req, res) => {
  try {
    const { status, walletAddress } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    if (status) filter.status = status;
    if (walletAddress) filter.walletAddress = walletAddress;
    
    const inspections = await Inspection.find(filter)
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching inspections',
      error: error.message
    });
  }
});

// Route for admin to update inspection status

router.put('/inspections/:inspectionId/status', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { status, inspectionNotes, registrationNumber, inspectedBy } = req.body;
    
    // Validate status
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    // Find the inspection
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inspection not found' 
      });
    }
    
    // Update inspection
    inspection.status = status;
    inspection.updatedAt = Date.now();
    
    // If approved and registration number provided, add it
    if (status === 'Approved' && registrationNumber) {
      inspection.registrationNumber = registrationNumber;
    }
    
    // Add inspection notes if provided
    if (inspectionNotes) {
      inspection.inspectionNotes = inspectionNotes;
    }
    
    // Record who performed the inspection
    if (inspectedBy) {
      inspection.inspectedBy = inspectedBy;
      inspection.inspectionDate = Date.now();
    }
    
    await inspection.save();
    
    res.status(200).json({
      success: true,
      message: `Inspection status updated to ${status}`,
      data: {
        inspectionId: inspection.inspectionId,
        status: inspection.status,
        registrationNumber: inspection.registrationNumber
      }
    });
  } catch (error) {
    console.error('Error updating inspection status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating inspection status',
      error: error.message
    });
  }
});

// Route to get inspection history by wallet address
router.get('/inspections/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const inspections = await Inspection.find({ walletAddress })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    console.error('Error fetching wallet inspections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching wallet inspections',
      error: error.message
    });
  }
});


router.post('/inspections/:inspectionId/vehicle-image', async (req, res) => {
  const { inspectionId } = req.params;
  const { imageUrl, walletAddress } = req.body;

  try {
    // Find the inspection by inspectionId and walletAddress
    const inspection = await Inspection.findOne({
      inspectionId,
      walletAddress,
    });

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    // Save the image URL
    inspection.vehicleImage = imageUrl;
    await inspection.save();

    res.status(200).json({ success: true, message: 'Vehicle image saved successfully' });
  } catch (err) {
    console.error('Error saving vehicle image:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET: Retrieve vehicle image URL for a specific inspection
router.get('/inspections/:inspectionId/vehicle-image', async (req, res) => {
  const { inspectionId } = req.params;

  try {
    const inspection = await Inspection.findOne({ inspectionId });

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    if (!inspection.vehicleImage) {
      return res.status(404).json({ success: false, message: 'No vehicle image found' });
    }

    res.status(200).json({
      success: true,
      vehicleImage: inspection.vehicleImage
    });
  } catch (err) {
    console.error('Error retrieving vehicle image:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// GET: Check payment status for an inspection
router.get('/inspections/:inspectionId/payment-status', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inspection not found' 
      });
    }

    res.status(200).json({
      success: true,
      isPaid: inspection.isPaid || false,
      transactionHash: inspection.transactionHash || '',
      paymentDate: inspection.paymentDate || null
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while checking payment status',
      error: error.message
    });
  }
});

// POST: Update payment status for an inspection
router.post('/inspections/:inspectionId/payment', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { isPaid, transactionHash, walletAddress } = req.body;
    
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inspection not found' 
      });
    }

    // Update payment information
    inspection.isPaid = isPaid;
    inspection.transactionHash = transactionHash;
    inspection.paymentDate = Date.now();
    inspection.payerWallet = walletAddress;
    inspection.updatedAt = Date.now();

    await inspection.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        inspectionId: inspection.inspectionId,
        isPaid: inspection.isPaid,
        transactionHash: inspection.transactionHash
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating payment status',
      error: error.message
    });
  }
});


module.exports = router;