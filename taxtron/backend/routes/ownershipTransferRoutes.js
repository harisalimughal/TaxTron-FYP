const express = require('express');
const router = express.Router();
const Inspection = require('../models/inspection');
const User = require('../models/user');
const OwnershipTransfer = require('../models/ownershipTransfer');
const OwnershipHistory = require('../models/ownershipHistory');
const { authenticateUser, adminAuth } = require('../middleware/auth');

// Search vehicle by chassis number
router.get('/search-vehicle/:chassisNumber', authenticateUser, async (req, res) => {
  try {
    const { chassisNumber } = req.params;
    
    // Find vehicle by chassis number
    const vehicle = await Inspection.findOne({ 
      'vehicleDetails.chassisNumber': chassisNumber,
      status: 'Approved' // Only approved vehicles can be transferred
    }).populate('userId', 'fullName cnic email walletAddress');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not approved for transfer'
      });
    }

    // Check if current user owns this vehicle
    if (vehicle.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not the owner of this vehicle'
      });
    }

    // Check if all taxes are paid
    if (!vehicle.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Registration fee must be paid before transfer'
      });
    }

    if (!vehicle.taxPaid) {
      return res.status(400).json({
        success: false,
        message: 'Annual tax must be paid before transfer'
      });
    }

    // Check if vehicle is already in transfer process
    const existingTransfer = await OwnershipTransfer.findOne({
      vehicleId: vehicle.inspectionId,
      status: { $in: ['pending_admin_approval', 'approved'] }
    });

    const responseData = {
      success: true,
      vehicle: {
        inspectionId: vehicle.inspectionId,
        chassisNumber: vehicle.vehicleDetails.chassisNumber,
        make: vehicle.vehicleDetails.make,
        model: vehicle.vehicleDetails.model,
        year: vehicle.vehicleDetails.manufacturingYear,
        vehicleType: vehicle.vehicleDetails.vehicleType,
        engineCapacity: vehicle.vehicleDetails.engineCapacity,
        color: vehicle.vehicleDetails.color,
        fuelType: vehicle.vehicleDetails.fuelType,
        registrationNumber: vehicle.registrationNumber,
        currentOwner: {
          name: vehicle.userId.fullName,
          cnic: vehicle.userId.cnic,
          email: vehicle.userId.email,
          walletAddress: vehicle.userId.walletAddress
        }
      }
    };

    // If there's an existing transfer, include transfer information
    if (existingTransfer) {
      responseData.existingTransfer = {
        transferId: existingTransfer.transferId,
        status: existingTransfer.status,
        fromOwner: existingTransfer.fromOwner,
        toOwner: existingTransfer.toOwner,
        transferFee: existingTransfer.transferFee,
        createdAt: existingTransfer.createdAt,
        initiatedBy: existingTransfer.initiatedBy.toString() === req.user.userId
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error searching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search user by CNIC
router.get('/search-user/:cnic', authenticateUser, async (req, res) => {
  try {
    const { cnic } = req.params;
    
    // Validate CNIC format (more flexible validation)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    const cnicWithoutDashes = cnic.replace(/-/g, '');
    const cnicNumericRegex = /^\d{13}$/;
    
    if (!cnicRegex.test(cnic) && !cnicNumericRegex.test(cnicWithoutDashes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CNIC format. Please use format: 12345-1234567-1 or 1234512345671'
      });
    }
    
    // Normalize CNIC format
    const normalizedCnic = cnicRegex.test(cnic) ? cnic : 
      `${cnicWithoutDashes.slice(0, 5)}-${cnicWithoutDashes.slice(5, 12)}-${cnicWithoutDashes.slice(12)}`;

    const user = await User.findOne({ cnic: normalizedCnic });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this CNIC'
      });
    }

    // Don't allow transfer to same user
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer vehicle to yourself'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user._id,
        fullName: user.fullName,
        cnic: user.cnic,
        email: user.email,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Initiate ownership transfer
router.post('/initiate', authenticateUser, async (req, res) => {
  try {
    const { vehicleId, recipientCnic, transferFee } = req.body;

    // Validate required fields
    if (!vehicleId || !recipientCnic) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID and recipient CNIC are required'
      });
    }

    // Find current user details
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find vehicle and verify ownership
    const vehicle = await Inspection.findOne({ 
      inspectionId: vehicleId,
      userId: req.user.userId,
      status: 'Approved'
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you are not the owner'
      });
    }

    // Find recipient
    const recipient = await User.findOne({ cnic: recipientCnic });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check if vehicle is already in transfer process
    const existingTransfer = await OwnershipTransfer.findOne({
      vehicleId: vehicleId,
      status: { $in: ['pending_admin_approval', 'approved'] }
    });

    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already in transfer process'
      });
    }

    // Create transfer record
    const transfer = new OwnershipTransfer({
      vehicleId: vehicleId,
      chassisNumber: vehicle.vehicleDetails.chassisNumber,
      fromOwner: {
        userId: currentUser._id,
        fullName: currentUser.fullName,
        cnic: currentUser.cnic,
        walletAddress: currentUser.walletAddress,
        email: currentUser.email
      },
      toOwner: {
        userId: recipient._id,
        fullName: recipient.fullName,
        cnic: recipient.cnic,
        walletAddress: recipient.walletAddress,
        email: recipient.email
      },
      transferFee: transferFee || 5000,
      initiatedBy: currentUser._id,
      status: 'pending_admin_approval'
    });

    await transfer.save();

    res.json({
      success: true,
      message: 'Transfer initiated successfully',
      transferId: transfer.transferId,
      transfer: {
        transferId: transfer.transferId,
        vehicle: {
          make: vehicle.vehicleDetails.make,
          model: vehicle.vehicleDetails.model,
          chassisNumber: vehicle.vehicleDetails.chassisNumber,
          registrationNumber: vehicle.registrationNumber
        },
        fromOwner: transfer.fromOwner,
        toOwner: transfer.toOwner,
        transferFee: transfer.transferFee,
        status: transfer.status
      }
    });
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel ownership transfer
router.post('/cancel/:transferId', authenticateUser, async (req, res) => {
  try {
    const { transferId } = req.params;

    // Find transfer record
    const transfer = await OwnershipTransfer.findOne({ 
      transferId: transferId,
      status: { $in: ['pending_admin_approval', 'approved'] }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or already processed'
      });
    }

    // Verify user is the initiator
    if (transfer.initiatedBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this transfer'
      });
    }

    // Update transfer status to cancelled
    transfer.status = 'cancelled';
    transfer.updatedAt = new Date();
    await transfer.save();

    res.json({
      success: true,
      message: 'Transfer cancelled successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        cancelledAt: transfer.updatedAt
      }
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Complete ownership transfer
router.post('/complete/:transferId', authenticateUser, async (req, res) => {
  try {
    const { transferId } = req.params;
    const { blockchainTxHash, transferDeed } = req.body;

    // Find transfer record
    const transfer = await OwnershipTransfer.findOne({ 
      transferId: transferId,
      status: 'approved'
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or already processed'
      });
    }

    // Verify user is the initiator
    if (transfer.initiatedBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this transfer'
      });
    }

    // Update vehicle ownership in Inspection model
    const vehicle = await Inspection.findOne({ inspectionId: transfer.vehicleId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle ownership
    vehicle.userId = transfer.toOwner.userId;
    vehicle.updatedAt = new Date();
    await vehicle.save();

    // Update transfer record
    transfer.status = 'completed';
    transfer.blockchainTxHash = blockchainTxHash || '';
    transfer.transferDeed = transferDeed || '';
    transfer.completedAt = new Date();
    await transfer.save();

    // Update ownership history
    await updateOwnershipHistory(transfer);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        completedAt: transfer.completedAt
      }
    });
  } catch (error) {
    console.error('Error completing transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get ownership history by vehicle ID
router.get('/history/:vehicleId', authenticateUser, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Find ownership history
    const history = await OwnershipHistory.findOne({ vehicleId: vehicleId });
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Ownership history not found'
      });
    }

    // Get complete vehicle details
    const vehicle = await Inspection.findOne({ inspectionId: vehicleId }).select('vehicleDetails');
    
    // Map vehicle details to match frontend expectations
    let vehicleDetails = null;
    if (vehicle && vehicle.vehicleDetails) {
      // Determine vehicle type based on make/model if it's "Other"
      let vehicleType = vehicle.vehicleDetails.vehicleType;
      if (vehicleType === 'Other') {
        const make = vehicle.vehicleDetails.make?.toLowerCase() || '';
        const model = vehicle.vehicleDetails.model?.toLowerCase() || '';
        
        // Check for motorcycle indicators
        if (make.includes('yamaha') || make.includes('honda') || make.includes('suzuki') || 
            make.includes('kawasaki') || make.includes('bajaj') || make.includes('tvs') ||
            model.includes('r15') || model.includes('cbr') || model.includes('ninja') ||
            model.includes('pulsar') || model.includes('apache') || model.includes('scooter')) {
          vehicleType = 'Motorcycle';
        }
        // Check for car indicators
        else if (make.includes('toyota') || make.includes('honda') || make.includes('suzuki') ||
                 make.includes('hyundai') || make.includes('kia') || make.includes('nissan') ||
                 make.includes('ford') || make.includes('chevrolet') || make.includes('skoda')) {
          vehicleType = 'Car';
        }
      }

      vehicleDetails = {
        make: vehicle.vehicleDetails.make,
        model: vehicle.vehicleDetails.model,
        year: vehicle.vehicleDetails.manufacturingYear || vehicle.vehicleDetails.registrationYear,
        chassisNumber: vehicle.vehicleDetails.chassisNumber,
        engineNumber: vehicle.vehicleDetails.engineNumber,
        color: vehicle.vehicleDetails.color,
        variant: vehicle.vehicleDetails.variant,
        vehicleType: vehicleType,
        fuelType: vehicle.vehicleDetails.fuelType,
        engineCapacity: vehicle.vehicleDetails.engineCapacity,
        manufacturingYear: vehicle.vehicleDetails.manufacturingYear,
        registrationYear: vehicle.vehicleDetails.registrationYear
      };
    }
    
    res.json({
      success: true,
      history: {
        vehicleId: history.vehicleId,
        chassisNumber: history.chassisNumber,
        vehicleDetails: vehicleDetails,
        ownershipHistory: history.ownershipHistory,
        totalTransfers: history.totalTransfers
      }
    });
  } catch (error) {
    console.error('Error fetching ownership history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search ownership history by chassis number (public endpoint)
router.get('/search-history/:chassisNumber', async (req, res) => {
  try {
    const { chassisNumber } = req.params;

    // Find ownership history by chassis number
    const history = await OwnershipHistory.findOne({ chassisNumber: chassisNumber });
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'No ownership history found for this chassis number'
      });
    }

    // Get complete vehicle details
    const vehicle = await Inspection.findOne({ 
      'vehicleDetails.chassisNumber': chassisNumber,
      status: 'Approved'
    }).select('vehicleDetails');

    // Map vehicle details to match frontend expectations
    let vehicleDetails = null;
    if (vehicle && vehicle.vehicleDetails) {
      // Determine vehicle type based on make/model if it's "Other"
      let vehicleType = vehicle.vehicleDetails.vehicleType;
      if (vehicleType === 'Other') {
        const make = vehicle.vehicleDetails.make?.toLowerCase() || '';
        const model = vehicle.vehicleDetails.model?.toLowerCase() || '';
        
        // Check for motorcycle indicators
        if (make.includes('yamaha') || make.includes('honda') || make.includes('suzuki') || 
            make.includes('kawasaki') || make.includes('bajaj') || make.includes('tvs') ||
            model.includes('r15') || model.includes('cbr') || model.includes('ninja') ||
            model.includes('pulsar') || model.includes('apache') || model.includes('scooter')) {
          vehicleType = 'Motorcycle';
        }
        // Check for car indicators
        else if (make.includes('toyota') || make.includes('honda') || make.includes('suzuki') ||
                 make.includes('hyundai') || make.includes('kia') || make.includes('nissan') ||
                 make.includes('ford') || make.includes('chevrolet') || make.includes('skoda')) {
          vehicleType = 'Car';
        }
      }

      vehicleDetails = {
        make: vehicle.vehicleDetails.make,
        model: vehicle.vehicleDetails.model,
        year: vehicle.vehicleDetails.manufacturingYear || vehicle.vehicleDetails.registrationYear,
        chassisNumber: vehicle.vehicleDetails.chassisNumber,
        engineNumber: vehicle.vehicleDetails.engineNumber,
        color: vehicle.vehicleDetails.color,
        variant: vehicle.vehicleDetails.variant,
        vehicleType: vehicleType,
        fuelType: vehicle.vehicleDetails.fuelType,
        engineCapacity: vehicle.vehicleDetails.engineCapacity,
        manufacturingYear: vehicle.vehicleDetails.manufacturingYear,
        registrationYear: vehicle.vehicleDetails.registrationYear
      };
    }

    res.json({
      success: true,
      history: {
        vehicleId: history.vehicleId,
        chassisNumber: history.chassisNumber,
        vehicleDetails: vehicleDetails,
        ownershipHistory: history.ownershipHistory,
        totalTransfers: history.totalTransfers
      }
    });
  } catch (error) {
    console.error('Error searching ownership history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get transfer status by transfer ID
router.get('/transfer-status/:transferId', authenticateUser, async (req, res) => {
  try {
    const { transferId } = req.params;

    const transfer = await OwnershipTransfer.findOne({ 
      transferId: transferId,
      $or: [
        { 'fromOwner.userId': req.user.userId },
        { 'toOwner.userId': req.user.userId }
      ]
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or you are not authorized to view this transfer'
      });
    }

    // Get vehicle details
    const vehicle = await Inspection.findOne({ 
      inspectionId: transfer.vehicleId,
      status: 'Approved'
    }).select('vehicleDetails registrationNumber');

    const responseData = {
      success: true,
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        fromOwner: transfer.fromOwner,
        toOwner: transfer.toOwner,
        transferFee: transfer.transferFee,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
        initiatedBy: transfer.initiatedBy.toString() === req.user.userId
      }
    };

    if (vehicle) {
      responseData.vehicle = {
        inspectionId: vehicle.inspectionId,
        chassisNumber: vehicle.vehicleDetails.chassisNumber,
        make: vehicle.vehicleDetails.make,
        model: vehicle.vehicleDetails.model,
        year: vehicle.vehicleDetails.manufacturingYear,
        vehicleType: vehicle.vehicleDetails.vehicleType,
        engineCapacity: vehicle.vehicleDetails.engineCapacity,
        color: vehicle.vehicleDetails.color,
        registrationNumber: vehicle.registrationNumber
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching transfer status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's transfer history
router.get('/my-transfers', authenticateUser, async (req, res) => {
  try {
    const transfers = await OwnershipTransfer.find({
      $or: [
        { 'fromOwner.userId': req.user.userId },
        { 'toOwner.userId': req.user.userId }
      ]
    }).sort({ createdAt: -1 });

    // Populate vehicle details for each transfer
    const transfersWithVehicleDetails = await Promise.all(
      transfers.map(async (transfer) => {
        try {
          // Find the vehicle details from the Inspection model
          const vehicle = await Inspection.findOne({ 
            'vehicleDetails.chassisNumber': transfer.chassisNumber,
            status: 'Approved'
          }).select('vehicleDetails');

          const transferObj = transfer.toObject();
          if (vehicle && vehicle.vehicleDetails) {
            transferObj.vehicle = {
              make: vehicle.vehicleDetails.make,
              model: vehicle.vehicleDetails.model,
              year: vehicle.vehicleDetails.year,
              chassisNumber: vehicle.vehicleDetails.chassisNumber,
              engineNumber: vehicle.vehicleDetails.engineNumber,
              color: vehicle.vehicleDetails.color
            };
          } else {
            // Fallback data if vehicle not found
            transferObj.vehicle = {
              make: 'Unknown',
              model: 'Unknown',
              year: 'Unknown',
              chassisNumber: transfer.chassisNumber,
              engineNumber: 'Unknown',
              color: 'Unknown'
            };
          }
          return transferObj;
        } catch (error) {
          console.error('Error populating vehicle details for transfer:', transfer.transferId, error);
          // Return transfer with fallback vehicle data
          const transferObj = transfer.toObject();
          transferObj.vehicle = {
            make: 'Unknown',
            model: 'Unknown',
            year: 'Unknown',
            chassisNumber: transfer.chassisNumber,
            engineNumber: 'Unknown',
            color: 'Unknown'
          };
          return transferObj;
        }
      })
    );

    res.json({
      success: true,
      transfers: transfersWithVehicleDetails
    });
  } catch (error) {
    console.error('Error fetching user transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Get pending transfers for approval
router.get('/admin/pending-transfers', adminAuth, async (req, res) => {
  try {
    console.log('Admin pending transfers endpoint hit');
    console.log('Admin ID from token:', req.adminId);
    // Note: In a real app, you'd check if user is admin
    // For now, we'll assume this endpoint is protected by admin middleware
    
    const transfers = await OwnershipTransfer.find({
      status: 'pending_admin_approval'
    }).sort({ createdAt: -1 });

    // Populate vehicle details for each transfer
    const transfersWithVehicleDetails = await Promise.all(
      transfers.map(async (transfer) => {
        try {
          const vehicle = await Inspection.findOne({ 
            inspectionId: transfer.vehicleId,
            status: 'Approved'
          }).select('vehicleDetails registrationNumber');

          const transferObj = transfer.toObject();
          if (vehicle && vehicle.vehicleDetails) {
            transferObj.vehicle = {
              make: vehicle.vehicleDetails.make,
              model: vehicle.vehicleDetails.model,
              year: vehicle.vehicleDetails.manufacturingYear,
              chassisNumber: vehicle.vehicleDetails.chassisNumber,
              engineNumber: vehicle.vehicleDetails.engineNumber,
              color: vehicle.vehicleDetails.color,
              registrationNumber: vehicle.registrationNumber
            };
          }
          return transferObj;
        } catch (error) {
          console.error('Error populating vehicle details for transfer:', transfer.transferId, error);
          return transfer.toObject();
        }
      })
    );

    res.json({
      success: true,
      transfers: transfersWithVehicleDetails
    });
  } catch (error) {
    console.error('Error fetching pending transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Approve transfer
router.post('/admin/approve/:transferId', adminAuth, async (req, res) => {
  try {
    const { transferId } = req.params;
    const { adminNotes } = req.body;

    const transfer = await OwnershipTransfer.findOne({ 
      transferId: transferId,
      status: 'pending_admin_approval'
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or already processed'
      });
    }

    // Update transfer status to approved
    transfer.status = 'approved';
    transfer.updatedAt = new Date();
    if (adminNotes) {
      transfer.adminNotes = adminNotes;
    }
    await transfer.save();

    res.json({
      success: true,
      message: 'Transfer approved successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        approvedAt: transfer.updatedAt
      }
    });
  } catch (error) {
    console.error('Error approving transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Reject transfer
router.post('/admin/reject/:transferId', adminAuth, async (req, res) => {
  try {
    const { transferId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const transfer = await OwnershipTransfer.findOne({ 
      transferId: transferId,
      status: 'pending_admin_approval'
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or already processed'
      });
    }

    // Update transfer status to rejected
    transfer.status = 'rejected';
    transfer.rejectionReason = rejectionReason;
    transfer.updatedAt = new Date();
    await transfer.save();

    res.json({
      success: true,
      message: 'Transfer rejected successfully',
      transfer: {
        transferId: transfer.transferId,
        status: transfer.status,
        rejectedAt: transfer.updatedAt,
        rejectionReason: transfer.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to update ownership history
async function updateOwnershipHistory(transfer) {
  try {
    // Find existing history or create new one
    let history = await OwnershipHistory.findOne({ vehicleId: transfer.vehicleId });
    
    if (!history) {
      // Create new history record
      history = new OwnershipHistory({
        vehicleId: transfer.vehicleId,
        chassisNumber: transfer.chassisNumber,
        ownershipHistory: []
      });
    }

    // Mark previous owner as ended
    if (history.ownershipHistory.length > 0) {
      const lastOwner = history.ownershipHistory[history.ownershipHistory.length - 1];
      lastOwner.endDate = transfer.transferDate;
      lastOwner.isCurrentOwner = false;
    }

    // Add new owner
    history.ownershipHistory.push({
      ownerId: transfer.toOwner.userId,
      ownerName: transfer.toOwner.fullName,
      cnic: transfer.toOwner.cnic,
      walletAddress: transfer.toOwner.walletAddress,
      email: transfer.toOwner.email,
      startDate: transfer.transferDate,
      endDate: null,
      transferType: 'transfer',
      transferId: transfer.transferId,
      isCurrentOwner: true
    });

    // Update total transfers count
    history.totalTransfers = history.ownershipHistory.filter(owner => owner.transferType === 'transfer').length;

    await history.save();
  } catch (error) {
    console.error('Error updating ownership history:', error);
  }
}

module.exports = router;
