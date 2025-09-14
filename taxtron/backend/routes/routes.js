const express = require('express');
const router = express.Router();

// 📌 Health Check Route
router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
    message: 'TaxTron API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});



// 📌 API Info Route
router.get('/info', (req, res) => {
    res.status(200).json({
      success: true,
    message: 'TaxTron Vehicle Registration System API',
    version: '1.0.0',
    endpoints: {
      appointments: '/api/appointments',
      inspections: '/api/inspections',
      vehicles: '/api/vehicles',
      users: '/api/users',
      admin: '/api/admin',
      vehicleDatabase: '/api/vehicle-database'
    },
    documentation: 'https://github.com/your-repo/taxtron-api'
  });
});

// 📌 Test Route for Debugging
router.get('/test-routes', (req, res) => {
    res.status(200).json({
      success: true,
    message: 'All routes are working',
    timestamp: new Date().toISOString()
  });
});


// 📌 404 Handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
      success: false, 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/info',
      'GET /api/appointments',
      'GET /api/inspections',
      'GET /api/vehicles',
      'GET /api/users',
      'GET /api/admin'
    ]
  });
});

module.exports = router;