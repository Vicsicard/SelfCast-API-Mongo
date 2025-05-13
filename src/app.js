/**
 * SelfCast API - Express Application
 * 
 * Main Express application configuration with middleware and routes
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const projectRoutes = require('./routes/projects');
const debugRoutes = require('./routes/debug');

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://self-cast-api-mongo.vercel.app', 
        'https://selfcast-dynamic.vercel.app',
        'https://selfcast-api-mongo.onrender.com',
        'https://user.selfcaststudios.com'
      ]
    : '*', // Allow all origins in development
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
};
app.use(cors(corsOptions));

// Add CORS headers to all responses as a backup
app.use((req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;
  
  // List of allowed origins
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://self-cast-api-mongo.vercel.app',
        'https://selfcast-dynamic.vercel.app',
        'https://selfcast-api-mongo.onrender.com',
        'https://user.selfcaststudios.com'
      ]
    : ['*'];
    
  // Set the appropriate CORS header based on the origin
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://user.selfcaststudios.com');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve generated static sites
app.use('/sites', express.static(path.join(__dirname, '../public/sites')));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/debug', debugRoutes);

// API base route
app.get('/api', (req, res) => {
  res.json({
    message: 'SelfCast API - MongoDB Edition',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      projects: '/api/projects',
      specificProject: '/api/projects/:projectId',
      projectContent: '/api/projects/:projectId/content'
    },
    documentation: 'See README.md for more details'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SelfCast API - MongoDB Edition',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      projects: '/api/projects',
      specificProject: '/api/projects/:projectId',
      projectContent: '/api/projects/:projectId/content'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 404 middleware for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app;
