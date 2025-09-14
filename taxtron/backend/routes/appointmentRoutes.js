const express = require('express');
const Appointment = require('../models/appointment');
const router = express.Router();

// Auto cleanup function that runs immediately
const performAutoCleanup = async () => {
  try {
    const now = new Date();
    console.log('=== AUTO CLEANUP RUNNING ===');
    console.log('Current date/time:', now.toISOString());
    
    // Remove all expired appointments immediately
    const deleteResult = await Appointment.deleteMany({
      scheduledDate: { $lt: now },
      status: 'Booked'
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`AUTO CLEANUP: Removed ${deleteResult.deletedCount} expired appointments`);
    } else {
      console.log('AUTO CLEANUP: No expired appointments to remove');
    }
    
    return deleteResult.deletedCount;
  } catch (error) {
    console.error('Auto cleanup error:', error);
    return 0;
  }
};

// Run cleanup immediately when this module loads
performAutoCleanup();

// Set up automatic cleanup every 5 minutes
setInterval(performAutoCleanup, 5 * 60 * 1000);

// 📌 Get Available Appointment Dates
router.get('/available', async (req, res) => {
  try {
    // Run cleanup before generating available dates
    await performAutoCleanup();
    
    // Generate available dates for the next 30 days
    const availableDates = [];
    const today = new Date();
    
    console.log('Generating available dates starting from:', today.toISOString());
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Check if this date is already booked
      const existingAppointment = await Appointment.findOne({
        scheduledDate: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        },
        status: 'Booked'
      });
      
      if (!existingAppointment) {
        const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        availableDates.push(dateString);
        console.log('Available date:', dateString);
      } else {
        console.log('Date already booked:', date.toISOString().split('T')[0]);
      }
    }
    
    console.log('Total available dates:', availableDates.length);
    
    res.status(200).json({
      success: true,
      data: availableDates
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch available dates', 
      details: error.message 
    });
  }
});

// 📌 Book Appointment
router.post('/book', async (req, res) => {
  try {
    // Run cleanup before processing new booking
    await performAutoCleanup();
    
    const { date, timeSlot, inspectionId } = req.body;
    
    if (!date || !timeSlot || !inspectionId) {
      return res.status(400).json({
        success: false,
        message: 'Date, time slot, and inspection ID are required'
      });
    }
    
    // Check if the date is still available
    const existingAppointment = await Appointment.findOne({
      scheduledDate: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'Booked'
    });
    
    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This date is no longer available'
      });
    }
    
    // Create or update appointment
    const appointment = await Appointment.findOneAndUpdate(
      {
        scheduledDate: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        scheduledDate: new Date(date),
        status: 'Booked',
        inspectionId: inspectionId,
        timeSlot: timeSlot
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
});

// 📌 Get All Appointments (for admin)
router.get('/', async (req, res) => {
  try {
    // Run cleanup before fetching appointments
    await performAutoCleanup();
    
    const { scheduledDate } = req.query;

    const filter = {};
    if (scheduledDate) {
      const startOfDay = new Date(scheduledDate);
      const endOfDay = new Date(scheduledDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      filter.scheduledDate = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }

    const appointments = await Appointment.find(filter).sort({ scheduledDate: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
  }
});

// 📌 Test endpoint to see all appointments
router.get('/test', async (req, res) => {
  try {
    const allAppointments = await Appointment.find({});
    console.log('All appointments in database:', allAppointments);
    
    res.status(200).json({
      success: true,
      message: 'All appointments retrieved',
      data: allAppointments,
      count: allAppointments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// 📌 Clean up expired appointments
router.delete('/cleanup-expired', async (req, res) => {
  try {
    const now = new Date();
    console.log('=== APPOINTMENT CLEANUP ===');
    console.log('Current date/time:', now.toISOString());
    
    // First, let's see all appointments to debug
    const allAppointments = await Appointment.find({});
    console.log('All appointments in database:');
    allAppointments.forEach(apt => {
      const isExpired = new Date(apt.scheduledDate) < now;
      console.log(`- ${apt.inspectionId || 'No ID'}: ${apt.scheduledDate} (${apt.timeSlot || 'No time'}) - Status: ${apt.status} - Expired: ${isExpired}`);
    });
    
    // Find all appointments that are past their scheduled date
    const expiredAppointments = await Appointment.find({
      scheduledDate: { $lt: now },
      status: 'Booked'
    });
    
    console.log(`Found ${expiredAppointments.length} expired appointments to clean up`);
    
    // Log the expired appointments for debugging
    expiredAppointments.forEach(apt => {
      console.log(`Expired appointment: ${apt.inspectionId || 'No ID'} scheduled for ${apt.scheduledDate} (${apt.timeSlot || 'No time'})`);
    });
    
    // Remove expired appointments
    const deleteResult = await Appointment.deleteMany({
      scheduledDate: { $lt: now },
      status: 'Booked'
    });
    
    console.log(`Cleaned up ${deleteResult.deletedCount} expired appointments`);
    console.log('=== CLEANUP COMPLETE ===');
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} expired appointments`,
      data: {
        currentDateTime: now.toISOString(),
        expiredCount: expiredAppointments.length,
        deletedCount: deleteResult.deletedCount,
        expiredAppointments: expiredAppointments.map(apt => ({
          inspectionId: apt.inspectionId,
          scheduledDate: apt.scheduledDate,
          timeSlot: apt.timeSlot
        }))
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up expired appointments',
      error: error.message
    });
  }
});

// 📌 Auto cleanup expired appointments (called periodically)
router.post('/auto-cleanup', async (req, res) => {
  try {
    const now = new Date();
    
    // Remove appointments immediately when they expire (no grace period)
    const deleteResult = await Appointment.deleteMany({
      scheduledDate: { $lt: now },
      status: 'Booked'
    });
    
    console.log(`Auto cleanup: Removed ${deleteResult.deletedCount} expired appointments`);
    
    res.status(200).json({
      success: true,
      message: `Auto cleanup completed: ${deleteResult.deletedCount} appointments removed`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error in auto cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Auto cleanup failed',
      error: error.message
    });
  }
});

// 📌 Force cleanup now (for testing)
router.get('/force-cleanup', async (req, res) => {
  try {
    console.log('=== FORCE CLEANUP TRIGGERED ===');
    const deletedCount = await performAutoCleanup();
    
    res.status(200).json({
      success: true,
      message: `Force cleanup completed: ${deletedCount} expired appointments removed`,
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Force cleanup failed',
      error: error.message
    });
  }
});

module.exports = router;
