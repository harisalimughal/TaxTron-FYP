const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db'); 
const route = require('./routes/routes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const vehicleDatabaseRoutes = require('./routes/vehicleDatabaseRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Set default values if not provided
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/taxtron';
}
if (!process.env.PORT) {
  process.env.PORT = 5000;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_jwt_secret_key_here_change_this_in_production';
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));

// Routes
console.log('Loading routes...');
try {
  app.use('/api/users', userRoutes);
  console.log('✓ User routes loaded');
} catch (error) {
  console.error('Error loading user routes:', error);
}

try {
  app.use('/api/vehicles', vehicleRoutes);
  console.log('✓ Vehicle routes loaded');
} catch (error) {
  console.error('Error loading vehicle routes:', error);
}

try {
  app.use('/api/vehicle-database', vehicleDatabaseRoutes);
  console.log('✓ Vehicle database routes loaded');
} catch (error) {
  console.error('Error loading vehicle database routes:', error);
}

try {
  app.use('/api/appointments', appointmentRoutes);
  console.log('✓ Appointment routes loaded');
} catch (error) {
  console.error('Error loading appointment routes:', error);
}

try {
  app.use('/api/inspections', inspectionRoutes);
  console.log('✓ Inspection routes loaded');
} catch (error) {
  console.error('Error loading inspection routes:', error);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✓ Admin routes loaded');
} catch (error) {
  console.error('Error loading admin routes:', error);
}

try {
  app.use('/api', route);
  console.log('✓ General routes loaded');
} catch (error) {
  console.error('Error loading general routes:', error);
}

console.log('All routes loaded successfully!');




// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Connect to database first
connectDB().then(() => {
  console.log('Connected to the database successfully!');
  
  // Set up the server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
