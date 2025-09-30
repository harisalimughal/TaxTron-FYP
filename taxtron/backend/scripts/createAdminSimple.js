// Simple script to create admin account
// This will be run when the backend server is running

const fetch = require('node-fetch');

const createAdmin = async () => {
  try {
    // First, let's try to create admin via a temporary endpoint
    console.log('Creating admin account...');
    
    // We'll need to add a temporary admin creation endpoint
    // For now, let's just show the credentials that should work
    console.log('✅ Admin credentials:');
    console.log('Email: admin');
    console.log('Password: 12345678');
    console.log('\nNote: You need to manually create this admin account in your MongoDB database.');
    console.log('Or add a temporary admin creation endpoint to your backend.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

createAdmin();
