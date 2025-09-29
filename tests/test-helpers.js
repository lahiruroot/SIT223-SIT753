const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

/**
 * Create a test admin user and return authentication token
 */
async function createTestAdmin() {
  const adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    isActive: true
  });

  const token = jwt.sign(
    { 
      userId: adminUser._id, 
      email: adminUser.email, 
      role: adminUser.role 
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  return { user: adminUser, token };
}

/**
 * Create a test regular user and return authentication token
 */
async function createTestUser() {
  const regularUser = await User.create({
    name: 'Test User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
    isActive: true
  });

  const token = jwt.sign(
    { 
      userId: regularUser._id, 
      email: regularUser.email, 
      role: regularUser.role 
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  return { user: regularUser, token };
}

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

module.exports = {
  createTestAdmin,
  createTestUser,
  getAuthHeaders
};
