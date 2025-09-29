const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const register = require('prom-client').register;
const connectDB = require('./config/database');
const app = require('./app');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const server = express();

// Security middleware
server.use(helmet());

// CORS configuration
server.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (NODE_ENV !== 'test') {
  server.use(morgan('combined'));
}

// Body parsing middleware
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true }));

// Health check endpoint
server.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    res.status(503).json(healthCheck);
  }
});

// Metrics endpoint for Prometheus
server.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// API routes
server.use('/api', app);

// Root endpoint
server.get('/', (req, res) => {
  res.json({
    message: 'Node.js Jenkins CI/CD Pipeline API',
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      api: '/api'
    }
  });
});

// 404 handler
server.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
server.use((error, req, res, _next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
if (require.main === module) {
  // Connect to MongoDB
  connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Metrics: http://localhost:${PORT}/metrics`);
  });
}

module.exports = server;


