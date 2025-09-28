const request = require('supertest');
const express = require('express');
const app = require('../src/app');

// Create test app
const testApp = express();
testApp.use(express.json());
testApp.use('/api', app);

describe('API Routes', () => {
  describe('GET /api/users', () => {
    it('should return all users with pagination', async () => {
      const response = await request(testApp)
        .get('/api/users')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should return filtered users when search query is provided', async () => {
      const response = await request(testApp)
        .get('/api/users?search=john')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const response = await request(testApp)
        .get('/api/users?page=1&limit=1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user by ID', async () => {
      const response = await request(testApp)
        .get('/api/users/1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(testApp)
        .get('/api/users/999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(testApp)
        .post('/api/users')
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        name: '',
        email: 'invalid-email'
      };

      const response = await request(testApp)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'john@example.com' // This email already exists
      };

      const response = await request(testApp)
        .post('/api/users')
        .send(duplicateUser)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const response = await request(testApp)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com'
      };

      const response = await request(testApp)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email'
      };

      const response = await request(testApp)
        .put('/api/users/1')
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      // First create a user to delete
      const newUser = {
        name: 'User to Delete',
        email: 'delete@example.com'
      };

      const createResponse = await request(testApp)
        .post('/api/users')
        .send(newUser)
        .expect(201);
      
      const userId = createResponse.body.data.id;

      const response = await request(testApp)
        .delete(`/api/users/${userId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(testApp)
        .delete('/api/users/999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/stats', () => {
    it('should return application statistics', async () => {
      const response = await request(testApp)
        .get('/api/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.memoryUsage).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  it('should handle malformed JSON', async () => {
    const response = await request(testApp)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{"name": "Test", "email": "test@example.com"')
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });

  it('should handle missing required fields', async () => {
    const response = await request(testApp)
      .post('/api/users')
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Validation failed');
  });
});

describe('API Response Format', () => {
  it('should return consistent response format for successful requests', async () => {
    const response = await request(testApp)
      .get('/api/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.success).toBe('boolean');
  });

  it('should return consistent response format for error requests', async () => {
    const response = await request(testApp)
      .get('/api/users/999')
      .expect(404);
    
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.success).toBe('boolean');
  });
});
