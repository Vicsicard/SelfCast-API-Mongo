/**
 * Simplified Debug Routes for SelfCast API
 * 
 * These routes are for debugging and maintenance purposes only.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Base directories
const PUBLIC_DIR = path.join(__dirname, '../../public');
const SITES_DIR = path.join(PUBLIC_DIR, 'sites');
const TEMPLATES_DIR = path.join(__dirname, '../../templates');

/**
 * GET /api/debug/social-preview
 * Simple preview of the updated social media section
 */
router.get('/social-preview', async (req, res) => {
  try {
    // Read our template file
    const socialTemplate = await fs.readFile(path.join(TEMPLATES_DIR, 'standard', 'social-section-template.html'), 'utf8');
    
    // Create sample data for social media posts
    const sampleData = {
      facebook_title_1: "Finding Peace in Quiet Moments",
      facebook_post_1: "I've been reflecting a lot on the kind of healing that doesn't get talked about enough.\nThe kind that's quiet and comes from deep listening.",
      
      twitter_title_1: "Quiet Healing",
      twitter_post_1: "Not all healing looks like a breakthrough.\nSometimes it's just letting yourself rest without guilt.",
      
      instagram_title_1: "Growth in Silence",
      instagram_post_1: "✨ Not all growth is loud.\nSometimes the most powerful healing comes in silence.",
      
      linkedin_title_1: "Growth Through Quiet Choices",
      linkedin_post_1: "I used to think growth had to be loud. That transformation had to come after a crisis."
    };
    
    // Create a simple HTML page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Social Media Preview</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .debug-box {
          background: #f0f0f0;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 5px;
        }
        pre {
          background: #333;
          color: #fff;
          padding: 1rem;
          overflow: auto;
          max-height: 300px;
        }
        .social-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .social-card {
          border: 1px solid #ddd;
          padding: 1rem;
          border-radius: 5px;
        }
        .platform-title {
          color: #3498db;
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      <h1>Social Media Debug View</h1>
      
      <div class="debug-box">
        <h2>Available Sample Data</h2>
        <pre>${JSON.stringify(sampleData, null, 2)}</pre>
      </div>
      
      <h2>Social Media Cards</h2>
      <div class="platform-section">
        <h3 class="platform-title">Facebook</h3>
        <div class="social-grid">
          <div class="social-card">
            <h4>${sampleData.facebook_title_1 || 'Facebook Title'}</h4>
            <p>${sampleData.facebook_post_1 || 'Facebook Post'}</p>
          </div>
        </div>
      </div>
      
      <div class="platform-section">
        <h3 class="platform-title">Twitter</h3>
        <div class="social-grid">
          <div class="social-card">
            <h4>${sampleData.twitter_title_1 || 'Twitter Title'}</h4>
            <p>${sampleData.twitter_post_1 || 'Twitter Post'}</p>
          </div>
        </div>
      </div>
      
      <div class="debug-box">
        <h2>MongoDB Information</h2>
        <p>MongoDB Connection String: mongodb+srv://vicsicard:***@cluster0.9uspndx.mongodb.net/selfcast</p>
        <p>If you're experiencing posting issues, please verify MongoDB connection is working correctly.</p>
      </div>
      
      <div class="debug-box">
        <h2>Troubleshooting Steps</h2>
        <ol>
          <li>Check that MongoDB connection is working</li>
          <li>Verify CORS settings in app.js</li>
          <li>Make sure window.siteContent is properly populated in the templates</li>
          <li>Check browser console for any JavaScript errors</li>
        </ol>
      </div>
      
      <script>
        console.log('Debug script loaded');
        
        // Log any errors
        window.onerror = function(message, source, lineno, colno, error) {
          console.error('JavaScript Error:', message, 'at', source, lineno, colno);
          return false;
        };
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

/**
 * GET /api/debug/check-dirs
 * Check if important directories exist and create them if they don't
 */
router.get('/check-dirs', async (req, res) => {
  try {
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
    
    res.json({
      success: true,
      message: 'Directory check completed',
      results
    });
  } catch (error) {
    console.error('Directory check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/debug/mongodb-test
 * Test MongoDB connection
 */
router.get('/mongodb-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionStatus = mongoose.connection.readyState;
    
    // Connection states:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    
    let status;
    switch (connectionStatus) {
      case 0:
        status = 'Disconnected';
        break;
      case 1:
        status = 'Connected';
        break;
      case 2:
        status = 'Connecting';
        break;
      case 3:
        status = 'Disconnecting';
        break;
      default:
        status = 'Unknown';
    }
    
    res.json({
      success: true,
      status,
      connectionState: connectionStatus,
      connectionUri: process.env.MONGODB_URI 
        ? process.env.MONGODB_URI.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3') 
        : 'Not Set',
      message: connectionStatus === 1 
        ? 'MongoDB connection is active and working' 
        : 'MongoDB is not properly connected'
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
