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
    ? 'https://user.selfcaststudios.com/api'  // Production custom domain URL
    : 'http://localhost:3001/api';           // Development URL (updated to port 3001)

window.SUPABASE_CONFIG = {
    // These values don't need to be real - our adapter will intercept all Supabase calls
    url: 'https://placeholder.supabase.co',
    key: 'placeholder-api-key-for-supabase',
    
    // MongoDB API settings - used by the adapter
    mongodb: {
        apiUrl: apiBaseUrl,
        environment: isProduction ? 'production' : 'development',
        // URL configuration - used for dynamic site URL generation
        useCustomDomain: isProduction,  // Use custom domain in production
        customDomain: 'user.selfcaststudios.com',
        renderUrl: 'selfcast-api-mongo.onrender.com'
    }
};

console.log(`SelfCast configuration loaded - MongoDB Edition (${isProduction ? 'Production' : 'Development'} Mode)`);
console.log(`API URL: ${apiBaseUrl}`);
