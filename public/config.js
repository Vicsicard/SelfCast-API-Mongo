/**
 * SelfCast Content Editor Configuration
 * These are placeholder values that will be intercepted by the MongoDB adapter
 */
window.SUPABASE_CONFIG = {
    // These values don't need to be real - our adapter will intercept all Supabase calls
    url: 'https://placeholder.supabase.co',
    key: 'placeholder-api-key-for-supabase',
    
    // MongoDB API settings - used by the adapter
    mongodb: {
        apiUrl: 'http://localhost:3000/api',
        // Add any other MongoDB-specific settings here
    }
};

console.log('SelfCast configuration loaded - MongoDB Edition');
