const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const { createTestAdmin, getAuthHeaders } = require('./test-helpers');

// Create test app
const testApp = express();
testApp.use(express.json());
testApp.use('/api', app);

describe('API Routes with MongoDB', () => {
  let adminToken;

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    
    // Create test admin user for authentication
    const { token } = await createTestAdmin();
    adminToken = token;
  });

  describe('GET /api/users', () => {
    it('should return all users with pagination', async () => {
      // Create test users
      await User.create([
        { name: 'John Doe', email: 'john@example.com', password: 'password123' },
        { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' }
      ]);

      const response = await request(testApp)
        .get('/api/users')
        .set(getAuthHeaders(adminToken))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should return filtered users when search query is provided', async () => {
      // Create test users
      await User.create([
        { name: 'John Doe', email: 'john@example.com', password: 'password123' },
        { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' }
      ]);

      const response = await request(testApp)
        .get('/api/users?search=john')
        .set(getAuthHeaders(adminToken))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('John Doe');
    });

    it('should handle pagination correctly', async () => {
      // Create multiple test users
      const users = Array.from({ length: 15 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: 'password123'
      }));
      await User.create(users);

      const response = await request(testApp)
        .get('/api/users?page=1&limit=5')
        .set(getAuthHeaders(adminToken))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data).toHaveLength(5);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user by ID', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const response = await request(testApp)
        .get(`/api/users/${user._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(testApp)
        .get(`/api/users/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(testApp)
        .post('/api/users')
        .set(getAuthHeaders(adminToken))
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
      expect(response.body.data._id).toBeDefined();
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(testApp)
        .post('/api/users')
        .set(getAuthHeaders(adminToken))
        .send(invalidUser)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });

      const duplicateUser = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request(testApp)
        .post('/api/users')
        .set(getAuthHeaders(adminToken))
        .send(duplicateUser)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const response = await request(testApp)
        .put(`/api/users/${user._id}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const response = await request(testApp)
        .put(`/api/users/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .send(updateData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const invalidData = {
        name: '',
        email: 'invalid-email'
      };

      const response = await request(testApp)
        .put(`/api/users/${user._id}`)
        .set(getAuthHeaders(adminToken))
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const response = await request(testApp)
        .delete(`/api/users/${user._id}`)
        .set(getAuthHeaders(adminToken))
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
      
      // Verify user is deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(testApp)
        .delete(`/api/users/${fakeId}`)
        .set(getAuthHeaders(adminToken))
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/stats', () => {
    it('should return application statistics', async () => {
      // Create some test users
      await User.create([
        { name: 'User 1', email: 'user1@example.com', password: 'password123', isActive: true },
        { name: 'User 2', email: 'user2@example.com', password: 'password123', isActive: true },
        { name: 'User 3', email: 'user3@example.com', password: 'password123', isActive: false }
      ]);

      const response = await request(testApp)
        .get('/api/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBe(3);
      expect(response.body.data.activeUsers).toBe(2);
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.memoryUsage).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  let adminToken;

  beforeEach(async () => {
    // Create test admin user for authentication
    const { token } = await createTestAdmin();
    adminToken = token;
  });

  it('should handle malformed JSON', async () => {
    const response = await request(testApp)
      .post('/api/users')
      .set(getAuthHeaders(adminToken))
      .set('Content-Type', 'application/json')
      .send('{"name": "Test", "email": "test@example.com"')
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });

  it('should handle missing required fields', async () => {
    const response = await request(testApp)
      .post('/api/users')
      .set(getAuthHeaders(adminToken))
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Validation failed');
  });
});

describe('API Response Format', () => {
  let adminToken;

  beforeEach(async () => {
    // Create test admin user for authentication
    const { token } = await createTestAdmin();
    adminToken = token;
  });

  it('should return consistent response format for successful requests', async () => {
    const response = await request(testApp)
      .get('/api/users')
      .set(getAuthHeaders(adminToken))
      .expect(200);
    
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.success).toBe('boolean');
  });

  it('should return consistent response format for error requests', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(testApp)
      .get(`/api/users/${fakeId}`)
      .set(getAuthHeaders(adminToken))
      .expect(404);
    
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.success).toBe('boolean');
  });
});