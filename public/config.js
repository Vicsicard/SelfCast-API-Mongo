/**
 * SelfCast Content Editor Configuration
 * 
 * This configuration supports both development and production environments.
 * In production, it points to the Render API URL.
 */

// Detect environment
const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('127.0.0.1');

// Set API URL based on environment
const apiBaseUrl = isProduction 
    ? 'https://selfcast-api-mongo.onrender.com/api'  // Production Render URL
    : 'http://localhost:3000/api';                   // Development URL

window.SUPABASE_CONFIG = {
    // These values don't need to be real - our adapter will intercept all Supabase calls
    url: 'https://placeholder.supabase.co',
    key: 'placeholder-api-key-for-supabase',
    
    // MongoDB API settings - used by the adapter
    mongodb: {
        apiUrl: apiBaseUrl,
        environment: isProduction ? 'production' : 'development'
    }
};

console.log(`SelfCast configuration loaded - MongoDB Edition (${isProduction ? 'Production' : 'Development'} Mode)`);
console.log(`API URL: ${apiBaseUrl}`);
