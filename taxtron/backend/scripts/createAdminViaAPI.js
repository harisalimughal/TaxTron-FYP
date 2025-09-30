const fetch = require('node-fetch');

const createAdmin = async () => {
  try {
    console.log('Creating admin account via API...');
    
    const response = await fetch('http://localhost:5000/api/admin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin',
        password: '12345678'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin account created successfully!');
      console.log('Email: admin');
      console.log('Password: 12345678');
      console.log('\nYou can now login to the admin panel using these credentials.');
    } else {
      console.log('❌ Error creating admin account:', data.message);
      if (data.message === 'Admin account already exists') {
        console.log('✅ Admin account already exists!');
        console.log('Email: admin');
        console.log('Password: 12345678');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
};

createAdmin();
