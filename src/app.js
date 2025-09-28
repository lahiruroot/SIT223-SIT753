const express = require('express');
const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'nodejs-jenkins-cicd'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register the custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

const router = express.Router();

// Middleware to track metrics
router.use((req, res, next) => {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // Decrement active connections
    activeConnections.dec();
  });
  
  next();
});

// Sample data store (in production, this would be a database)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
];

let nextId = 3;

// Utility functions
const findUserById = (id) => users.find(user => user.id === parseInt(id));
const validateUser = (user) => {
  const errors = [];
  if (!user.name || user.name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (!user.email || !/\S+@\S+\.\S+/.test(user.email)) {
    errors.push('Valid email is required');
  }
  return errors;
};

// Routes

// GET /api/users - Get all users
router.get('/users', (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filteredUsers = users;
    
    // Search functionality
    if (search) {
      filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// POST /api/users - Create new user
router.post('/users', (req, res) => {
  try {
    const errors = validateUser(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === req.body.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    const newUser = {
      id: nextId++,
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const errors = validateUser(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Check if email already exists (excluding current user)
    const existingUser = users.find(u => u.email === req.body.email && u.id !== parseInt(req.params.id));
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    // Update user
    user.name = req.body.name.trim();
    user.email = req.body.email.trim();
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const userIndex = users.findIndex(user => user.id === parseInt(req.params.id));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedUser,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// GET /api/stats - Get application statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalUsers: users.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

// Error handling for API routes
router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
