const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Admin registration data - customize these values as needed
const adminData = {
  name: "Site Admin",
  email: "admin@techstore.com",
  password: "Admin123!",
  address: "Tech Store Headquarters",
  adminKey: "admin-secret-123"  // Required admin key from the backend code
};

// Register admin user
async function registerAdmin() {
  try {
    console.log('Attempting to register admin user...');
    const response = await axios.post(`${API_BASE_URL}/auth/admin/register`, adminData);
    console.log('Admin registration successful:', response.data);
    console.log('\nAdmin credentials:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
  } catch (error) {
    console.error('Admin registration failed:', error.response ? error.response.data : error.message);
  }
}

// Execute the function
registerAdmin();