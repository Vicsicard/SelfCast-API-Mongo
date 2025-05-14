/**
 * SelfCast API - MongoDB Edition
 * Main server file
 */

const app = require('./app');

// Import keep-alive service (prevents Render free tier from spinning down)
const { startKeepAlive } = require('./utils/keep_alive');

// Define port (using 3001 instead of 3000 to avoid conflicts)
const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
  
  // Start keep-alive service in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Starting keep-alive service for Render...');
    startKeepAlive();
  }
});
