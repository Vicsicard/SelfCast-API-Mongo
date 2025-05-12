/**
 * Render Keep-Alive Script
 * 
 * This script prevents Render's free tier from spinning down due to inactivity.
 * It can be run as a separate process or integrated into your main application.
 * 
 * Usage:
 * 1. As a standalone script: node src/utils/keep_alive.js
 * 2. Imported in your main app: require('./utils/keep_alive')
 */

const https = require('https');
const http = require('http');

// Configuration
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
const APP_URL = process.env.APP_URL || 'https://selfcast-api-mongo.onrender.com';
const PING_ENDPOINTS = [
  '/',                                // Root endpoint
  '/api/projects',                    // Projects list endpoint
  '/api/projects/adam-hyp-1/content'  // Sample project content
];

// Log with timestamp
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Keep-Alive: ${message}`);
};

// Ping a specific endpoint
const pingEndpoint = (endpoint) => {
  const url = `${APP_URL}${endpoint}`;
  log(`Pinging ${url}`);
  
  // Determine if we need http or https
  const requester = url.startsWith('https') ? https : http;
  
  const req = requester.get(url, (res) => {
    const { statusCode } = res;
    log(`Received response: ${statusCode}`);
    
    // Consume response data to free up memory
    res.resume();
  });
  
  req.on('error', (error) => {
    log(`Error pinging ${url}: ${error.message}`);
  });
  
  req.end();
};

// Ping all endpoints in sequence
const pingAllEndpoints = () => {
  log('Starting ping cycle...');
  
  // Ping each endpoint with a small delay between them
  PING_ENDPOINTS.forEach((endpoint, index) => {
    setTimeout(() => {
      pingEndpoint(endpoint);
    }, index * 1000); // 1 second between pings
  });
};

// Start the keep-alive process
const startKeepAlive = () => {
  log('Keep-alive service started');
  
  // Initial ping
  pingAllEndpoints();
  
  // Schedule regular pings
  setInterval(pingAllEndpoints, PING_INTERVAL);
};

// If this script is run directly
if (require.main === module) {
  startKeepAlive();
} else {
  // If this script is imported, export the function
  module.exports = { startKeepAlive };
}
