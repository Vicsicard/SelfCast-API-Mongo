/**
 * SelfCast MongoDB Adapter - Auth Module
 * 
 * This file provides a compatibility layer for Supabase auth functions
 * that are used by the Content Editor. It redirects authentication
 * requests to the MongoDB API.
 */

// Store auth state
let currentUser = null;
let session = null;

// Admin credentials
const ADMIN_EMAIL = 'vicsicard@gmail.com';
const ADMIN_PASSWORD = 'Jerrygarcia1993!';

// Mock Supabase auth object
const supabaseAuth = {
  // Get current session
  getSession: async () => {
    console.log('📝 MongoDB Adapter: Getting session');
    return { data: { session } };
  },
  
  // Get current user
  getUser: async () => {
    console.log('📝 MongoDB Adapter: Getting user');
    return { data: { user: currentUser } };
  },
  
  // Sign in with email and password
  signInWithPassword: async ({ email, password }) => {
    console.log('📝 MongoDB Adapter: Sign in attempt');
    
    // Check if credentials match admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      currentUser = {
        id: 'admin-user',
        email: ADMIN_EMAIL,
        user_metadata: {
          name: 'SelfCast Admin',
          role: 'admin'
        }
      };
      
      session = {
        access_token: 'admin-token-' + Date.now(),
        user: currentUser
      };
      
      console.log('📝 MongoDB Adapter: Admin authentication successful');
      return {
        data: { user: currentUser, session },
        error: null
      };
    }
    
    // Non-matching credentials
    console.log('📝 MongoDB Adapter: Authentication failed');
    return {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    };
  },
  
  // Sign out
  signOut: async () => {
    console.log('📝 MongoDB Adapter: Sign out');
    currentUser = null;
    session = null;
    return { error: null };
  },
  
  // Auth state change listener
  onAuthStateChange: (callback) => {
    console.log('📝 MongoDB Adapter: Auth state change listener registered');
    // Auto-authenticate with admin credentials
    setTimeout(() => {
      if (!currentUser) {
        // Set admin user
        currentUser = {
          id: 'admin-user',
          email: ADMIN_EMAIL,
          user_metadata: {
            name: 'SelfCast Admin',
            role: 'admin'
          }
        };
        
        session = {
          access_token: 'admin-token-' + Date.now(),
          user: currentUser
        };
        
        console.log('📝 MongoDB Adapter: Auto-authenticated as admin');
      }
      
      callback('SIGNED_IN', { session });
    }, 100);
    
    // Return unsubscribe function
    return () => {
      console.log('📝 MongoDB Adapter: Auth state listener unsubscribed');
    };
  }
};

console.log('🔐 MongoDB Auth Adapter loaded');

// Export the mock auth object
window.supabaseAuth = supabaseAuth;
