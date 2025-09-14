const express = require('express');
const Inspection = require('../models/inspection');
const router = express.Router();

// 📌 Get All Inspections (with user data populated)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }
    
    const inspections = await Inspection.find(filter)
      .populate('userId', 'fullName email cnic walletAddress')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: inspections,
      count: inspections.length
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspections',
      error: error.message
    });
  }
});

// 📌 Check Registration Number Availability (specific route first)
router.get('/check-registration/:registrationNumber', async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    
    const existingInspection = await Inspection.findOne({ 
      registrationNumber: registrationNumber 
    });
    
    res.status(200).json({
      success: true,
      exists: !!existingInspection,
      message: existingInspection ? 'Registration number already exists' : 'Registration number available'
    });
  } catch (error) {
    console.error('Error checking registration number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration number',
      error: error.message
    });
  }
});

// 📌 Get Inspections by Wallet Address (specific route first)
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const inspections = await Inspection.find({ 
      'userId.walletAddress': address 
    }).populate('userId', 'fullName email cnic walletAddress');
    
    res.status(200).json({
      success: true,
      data: inspections,
      count: inspections.length
    });
  } catch (error) {
    console.error('Error fetching inspections by wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspections by wallet address',
      error: error.message
    });
  }
});

// 📌 Update Inspection Status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, registrationNumber, vehicleImage, inspectedBy } = req.body;
    
    console.log('Updating inspection status for ID:', id);
    console.log('Request body:', { status, notes, registrationNumber, vehicleImage, inspectedBy });
    
    const updateData = { status };
    if (notes !== undefined) updateData.inspectionNotes = notes;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (vehicleImage !== undefined) updateData.vehicleImage = vehicleImage;
    if (inspectedBy !== undefined) updateData.inspectedBy = inspectedBy;
    updateData.inspectionDate = new Date();
    
    const updatedInspection = await Inspection.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).populate('userId', 'fullName email cnic walletAddress');
    
    if (!updatedInspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Inspection status updated successfully',
      data: updatedInspection
    });
  } catch (error) {
    console.error('Error updating inspection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inspection status',
      error: error.message
    });
  }
});

// 📌 Update Payment Status
router.post('/:inspectionId/payment', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { isPaid, transactionHash, walletAddress, registrationNumber, blockchainConfirmed } = req.body;
    
    console.log('=== PAYMENT STATUS UPDATE ===');
    console.log('Inspection ID:', inspectionId);
    console.log('Payment data:', { isPaid, transactionHash, walletAddress, registrationNumber, blockchainConfirmed });
    
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }
    
    // Update payment fields
    inspection.isPaid = isPaid;
    inspection.transactionHash = transactionHash;
    inspection.paymentDate = new Date();
    inspection.payerWallet = walletAddress;
    inspection.updatedAt = new Date();
    
    // Update registration number if provided
    if (registrationNumber) {
      inspection.registrationNumber = registrationNumber;
    }
    
    await inspection.save();
    
    console.log('Payment status updated successfully for:', inspectionId);
    console.log('Updated inspection isPaid:', inspection.isPaid);
    console.log('Updated inspection transactionHash:', inspection.transactionHash);
    
    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        inspectionId: inspection.inspectionId,
        isPaid: inspection.isPaid,
        transactionHash: inspection.transactionHash,
        paymentDate: inspection.paymentDate,
        registrationNumber: inspection.registrationNumber
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
});

// 📌 Get Payment Status
router.get('/:inspectionId/payment-status', async (req, res) => {
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
      paymentDate: inspection.paymentDate,
      registrationNumber: inspection.registrationNumber
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
});

// 📌 TEMPORARY: Manual Payment Test Endpoint
router.post('/test-payment/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    
    console.log('=== MANUAL PAYMENT TEST ===');
    console.log('Testing payment update for:', inspectionId);
    
    const inspection = await Inspection.findOne({ inspectionId });
    
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }
    
    console.log('Before update - isPaid:', inspection.isPaid);
    
    // Update payment fields
    inspection.isPaid = true;
    inspection.transactionHash = 'TEST-TX-' + Date.now();
    inspection.paymentDate = new Date();
    inspection.payerWallet = 'TEST-WALLET';
    inspection.updatedAt = new Date();
    
    await inspection.save();
    
    console.log('After update - isPaid:', inspection.isPaid);
    console.log('Manual payment test completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Manual payment test successful',
      data: {
        inspectionId: inspection.inspectionId,
        isPaid: inspection.isPaid,
        transactionHash: inspection.transactionHash,
        paymentDate: inspection.paymentDate
      }
    });
  } catch (error) {
    console.error('Manual payment test error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual payment test failed',
      error: error.message
    });
  }
});

// 📌 Get Inspection by ID (generic route last)
router.get('/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    
    const inspection = await Inspection.findOne({ inspectionId })
      .populate('userId', 'fullName email cnic walletAddress');
    
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
      message: 'Failed to fetch inspection',
      error: error.message
    });
  }
});

module.exports = router;
