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
const projectRoutes = require('./routes/projects-fixed'); // Using fixed version with better error handling
const debugRoutes = require('./routes/debug-simplified');

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

// Configure CORS with improved error handling
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'https://self-cast-api-mongo.vercel.app', 
          'https://selfcast-dynamic.vercel.app',
          'https://selfcast-api-mongo.onrender.com',
          'https://user.selfcaststudios.com'
        ]
      : ['*']; // Allow all origins in development
    
    // Add localhost and 127.0.0.1 variations for development and testing
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5500');
      allowedOrigins.push('http://127.0.0.1:3000');
      allowedOrigins.push('http://127.0.0.1:5500');
      // Include proxy ports for browser preview
      for (let port = 50000; port < 60000; port++) {
        allowedOrigins.push(`http://127.0.0.1:${port}`);
      }
    }
    
    // Check if origin is allowed or is a wildcard match
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from: ${origin}`);
      // In development, allow anyway for easier debugging
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  maxAge: 86400 // 24 hours
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

// Middleware to handle direct requests for config.js, script.js, etc.
app.get('/sites/:projectId/:file', async (req, res, next) => {
  try {
    const { projectId, file } = req.params;
    
    // Handle special case for config.js and script.js
    if (file === 'config.js' || file === 'script.js') {
      const fs = require('fs').promises;
      const filePath = path.join(__dirname, '../public/sites', projectId, file);
      
      try {
        // Check if the file exists
        await fs.access(filePath);
        // File exists, continue to static file middleware
        return next();
      } catch (error) {
        // If the file is config.js, check if there's a global config.js in the public directory
        if (file === 'config.js') {
          const globalConfigPath = path.join(__dirname, '../public/config.js');
          
          try {
            await fs.access(globalConfigPath);
            // Serve the global config.js file
            return res.sendFile(globalConfigPath);
          } catch (globalConfigError) {
            // Global config.js doesn't exist, continue with site generation
            console.log('Global config.js not found, continuing with site generation');
          }
        }
        
        // File doesn't exist, check if the project exists
        console.log(`File ${file} for project ${projectId} not found, checking project...`);
        
        // Check if the project directory exists
        const projectPath = path.join(__dirname, '../public/sites', projectId);
        try {
          await fs.access(projectPath);
          // Project exists but file doesn't, regenerate the site
          console.log(`Project ${projectId} exists but ${file} is missing, regenerating...`);
        } catch (projectError) {
          // Project doesn't exist, check if it's a valid project ID
          console.log(`Project directory for ${projectId} not found, checking database...`);
        }
        
        // Import the generateSite function
        const { generateSite } = require('./utils/site-generator');
        
        // Generate the site
        const result = await generateSite(projectId);
        
        if (!result.success) {
          console.error(`Failed to generate site for ${projectId}: ${result.error}`);
          return res.status(404).json({
            error: 'Not found',
            message: `File ${file} for project ${projectId} could not be generated`
          });
        }
        
        // Site has been generated, continue to static file middleware
        return next();
      }
    }
    
    // For other files, continue to next middleware
    next();
  } catch (error) {
    console.error('Error in file middleware:', error);
    next(error);
  }
});

// Middleware to check if a site exists and regenerate it if needed
app.use('/sites/:projectId', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    
    // Check if projectId looks like a file (contains a file extension)
    if (/\.(js|css|html|jpg|png|gif|svg|json|ico)$/i.test(projectId)) {
      console.log(`Received request for file ${projectId} directly at project level, skipping site generation`);
      
      // Special case: if projectId is 'config.js', check for global config
      if (projectId === 'config.js') {
        // Check if there's a global config.js in the public directory
        const fs = require('fs').promises;
        const globalConfigPath = path.join(__dirname, '../public/config.js');
        
        try {
          await fs.access(globalConfigPath);
          // Serve the global config.js file
          return res.sendFile(globalConfigPath);
        } catch (error) {
          // Global config.js doesn't exist, return a 404
          return res.status(404).json({
            error: 'Not found',
            message: 'Global config.js file not found'
          });
        }
      }
      
      // For other files, return 404
      return res.status(404).json({
        error: 'Not found',
        message: `${projectId} is not a valid project ID. Direct file access at this level is not supported.`
      });
    }
    
    const fs = require('fs').promises;
    const sitePath = path.join(__dirname, '../public/sites', projectId);
    const indexPath = path.join(sitePath, 'index.html');
    
    // Check if the site exists
    try {
      await fs.access(indexPath);
      // Site exists, continue to static file middleware
      next();
    } catch (error) {
      console.log(`Site for ${projectId} does not exist at ${indexPath}, regenerating...`);
      
      // Import the generateSite function
      const { generateSite } = require('./utils/site-generator');
      
      // Generate the site
      const result = await generateSite(projectId);
      
      if (!result.success) {
        console.error(`Failed to generate site for ${projectId}: ${result.error}`);
        return res.status(404).json({
          error: 'Not found',
          message: `Site for project ${projectId} could not be generated`
        });
      }
      
      // Site has been generated, continue to static file middleware
      next();
    }
  } catch (error) {
    console.error('Error in site middleware:', error);
    next(error);
  }
});

// Serve generated static sites
app.use('/sites', express.static(path.join(__dirname, '../public/sites')));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/debug', debugRoutes);

// Debug routes for maintenance and troubleshooting
app.get('/api/debug/check-dirs', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Base directories
    const PUBLIC_DIR = path.join(__dirname, '../public');
    const SITES_DIR = path.join(PUBLIC_DIR, 'sites');
    const TEMPLATES_DIR = path.join(__dirname, '../templates');
    
    const results = {};
    
    // Check and create directories
    const directories = [
      { name: 'public', path: PUBLIC_DIR },
      { name: 'sites', path: SITES_DIR },
      { name: 'templates', path: TEMPLATES_DIR }
    ];
    
    for (const dir of directories) {
      try {
        await fs.access(dir.path);
        results[dir.name] = { exists: true, path: dir.path };
      } catch (error) {
        // Directory doesn't exist, create it
        try {
          await fs.mkdir(dir.path, { recursive: true });
          results[dir.name] = { 
            exists: true, 
            created: true,
            path: dir.path 
          };
        } catch (createError) {
          results[dir.name] = { 
            exists: false, 
            error: createError.message,
            path: dir.path 
          };
        }
      }
    }
    
    // Check for template files
    try {
      const templateFiles = await fs.readdir(TEMPLATES_DIR);
      results.templateFiles = templateFiles;
    } catch (error) {
      results.templateFiles = { error: error.message };
    }
    
    // Check for site directories
    try {
      const siteDirectories = await fs.readdir(SITES_DIR);
      results.siteDirectories = siteDirectories;
    } catch (error) {
      results.siteDirectories = { error: error.message };
    }
    
    res.json({
      success: true,
      message: 'Directory check completed',
      results
    });
  } catch (error) {
    console.error('Error checking directories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/debug/create-test-site/:projectId', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const { projectId } = req.params;
    const SITES_DIR = path.join(__dirname, '../public/sites');
    const projectDir = path.join(SITES_DIR, projectId);
    
    console.log(`Creating test site for project: ${projectId}`);
    console.log(`Project directory: ${projectDir}`);
    
    // Create project directory
    await fs.mkdir(projectDir, { recursive: true });
    console.log(`Created project directory: ${projectDir}`);
    
    // Create a simple index.html file
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Site for ${projectId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; }
    .success { color: #27ae60; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Test Site for ${projectId}</h1>
  <p>This is a test site generated for project ID: <strong>${projectId}</strong></p>
  <p>If you can see this page, the site generation is <span class="success">working correctly</span>!</p>
  <p>Generated at: ${new Date().toISOString()}</p>
</body>
</html>
    `;
    
    await fs.writeFile(path.join(projectDir, 'index.html'), indexHtml);
    console.log(`Created index.html file in ${projectDir}`);
    
    // Determine the site URL
    const isProduction = process.env.NODE_ENV === 'production';
    let siteUrl;
    
    if (isProduction) {
      // In production, use the Render domain or custom domain if available
      const customDomain = process.env.CUSTOM_DOMAIN || 'user.selfcaststudios.com';
      const renderUrl = process.env.RENDER_URL || 'selfcast-api-mongo.onrender.com';
      // Use custom domain if available, otherwise use Render URL
      const baseUrl = process.env.USE_CUSTOM_DOMAIN === 'true' ? customDomain : renderUrl;
      siteUrl = `https://${baseUrl}/sites/${projectId}/`;
    } else {
      // For local development
      const port = process.env.PORT || 3000;
      siteUrl = `http://localhost:${port}/sites/${projectId}/`;
    }
    
    console.log(`Site URL: ${siteUrl}`);
    
    res.json({
      success: true,
      message: `Test site created for project: ${projectId}`,
      projectId,
      siteUrl,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating test site:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
