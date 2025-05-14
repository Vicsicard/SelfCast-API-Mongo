/**
 * Debug Routes for SelfCast API
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
 * Preview of the updated social media section with modals
 */
router.get('/social-preview', async (req, res) => {
  try {
    // Read our custom HTML, CSS, and JS files
    const socialTemplate = await fs.readFile(path.join(TEMPLATES_DIR, 'standard', 'social-section-template.html'), 'utf8');
    const socialStyles = await fs.readFile(path.join(TEMPLATES_DIR, 'standard', 'social-styles.css'), 'utf8');
    const modalFunctions = await fs.readFile(path.join(TEMPLATES_DIR, 'standard', 'modal-functions.js'), 'utf8');
    
    // Sample data for the social media posts
    const sampleData = {
      // Facebook posts
      facebook_title_1: "Finding Peace in Quiet Moments",
      facebook_post_1: "I've been reflecting a lot on the kind of healing that doesn't get talked about enough.\nThe kind that's quiet. The kind that doesn't come from a breakdown or a dramatic moment — but from small choices, deep listening, and learning how to trust yourself again.\n#healingjourney #personalgrowth",
      
      facebook_title_2: "Setting Boundaries with Love",
      facebook_post_2: "How do you know when it's time to let go of a relationship that no longer serves you? I've been thinking about this question a lot lately.\n#relationships #boundaries",
      
      facebook_title_3: "Daily Mindfulness Practice",
      facebook_post_3: "Just published a new article about finding peace in everyday moments. Would love to hear your thoughts!\n#mindfulness #dailyhabits",
      
      facebook_title_4: "Morning Rituals",
      facebook_post_4: "What's one small thing you do every day that brings you joy? For me, it's my morning coffee ritual.\n#selfcare #morningroutines",
      
      // Twitter posts
      twitter_title_1: "Quiet Healing",
      twitter_post_1: "Not all healing looks like a breakthrough.\nSometimes, healing looks like:\n – Softening your voice\n – Saying \"no\" for the first time\n – Letting yourself rest without guilt\n#softpower #healingjourney",
      
      twitter_title_2: "The Power of Listening",
      twitter_post_2: "The most valuable therapy session I ever had cost me exactly $0. It was a conversation with someone who simply knew how to listen.\n#connection #listening",
      
      twitter_title_3: "Rest is Productive",
      twitter_post_3: "Reminder: You don't have to be productive every minute of every day. Rest is part of the process too.\n#restisproductive #selfcare",
      
      twitter_title_4: "Mental Health Matters",
      twitter_post_4: "Your mental health matters just as much as your physical health. Take care of your mind today.\n#mentalhealth #selfcare",
      
      // Instagram posts
      instagram_title_1: "Growth in Silence",
      instagram_post_1: "✨ Not all growth is loud.\nSometimes the most powerful healing comes in silence — in the small moments when we finally start listening to ourselves.\n#gentlegrowth #softnessasstrength",
      
      instagram_title_2: "Morning Light",
      instagram_post_2: "Morning light in my favorite reading spot. What's your sanctuary?\n#morningvibes #readingnook",
      
      instagram_title_3: "New Journal Day",
      instagram_post_3: "New journal day is always a good day. Anyone else feel the potential of blank pages?\n#journaling #creativity",
      
      instagram_title_4: "Nature Walks",
      instagram_post_4: "Weekend walks in nature are my reset button. What's yours?\n#natureheals #weekendvibes",
      
      // LinkedIn posts
      linkedin_title_1: "Growth Through Quiet Choices",
      linkedin_post_1: "I used to think growth had to be loud. That transformation had to come after a crisis — something big enough to wake you up.\n#emotionalintelligence #healingjourney",
      
      linkedin_title_2: "Leading Through Questions",
      linkedin_post_2: "Leadership isn't about having all the answers—it's about asking better questions.\n#leadership #teambuilding",
      
      linkedin_title_3: "Well-being Over Productivity",
      linkedin_post_3: "The most successful people I know prioritize their well-being over their productivity.\n#worklifebalance #productivity",
      
      linkedin_title_4: "Collaboration Over Competition",
      linkedin_post_4: "Collaboration over competition. How building relationships can accelerate your career growth.\n#networking #careeradvice"
    };
    
    // Process the HTML template with our sample data
    let processedHTML = socialTemplate;
    
    // Replace data-key attributes with actual content
    Object.keys(sampleData).forEach(key => {
      const value = sampleData[key];
      const regex = new RegExp(`data-key="${key}">.*?<`, 'g');
      processedHTML = processedHTML.replace(regex, `data-key="${key}">${value}<`);
    });
    
    // Create a full HTML page with our components
    // First, escape any backslashes in the JS and CSS
    const safeModalFunctions = modalFunctions.replace(/\\n/g, '\\\\n');
    const safeSocialStyles = socialStyles.replace(/\\n/g, '\\\\n');
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Social Media Section Preview</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #2C3E50;
        }
        .site-preview {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          padding: 2rem;
          margin-top: 1rem;
        }
        
        /* Debug Panel Styles */
        .debug-controls {
          margin-bottom: 1rem;
          display: flex;
          gap: 10px;
        }
        
        .debug-button {
          background-color: #4a5568;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .debug-button:hover {
          background-color: #2d3748;
        }
        
        .debug-panel {
          background-color: #1a202c;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .debug-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .debug-col h4 {
          color: #a0aec0;
          margin-top: 0;
          border-bottom: 1px solid #4a5568;
          padding-bottom: 8px;
        }
        
        .debug-log, .debug-content {
          background-color: #2d3748;
          padding: 10px;
          border-radius: 4px;
          height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        
        .log-entry {
          margin-bottom: 6px;
          border-bottom: 1px solid #4a5568;
          padding-bottom: 6px;
        }
        
        .hashtag {
          color: var(--accent-color);
          font-weight: bold;
        }
        
        /* Custom variables */
        :root {
          --primary-color: #2C3E50;
          --accent-color: #3498DB;
          --background-color: #ffffff;
          --text-color: #333333;
        }
        ${socialStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Social Media Section Preview</h1>
        
        <!-- Debug Controls -->
        <div class="debug-controls">
          <button id="toggle-debug" class="debug-button">Show Debug Panel</button>
          <button id="check-content" class="debug-button">Check Site Content</button>
          <button id="dump-content" class="debug-button">Dump Content to Console</button>
        </div>
        
        <!-- Debug Panel -->
        <div id="debug-panel" class="debug-panel" style="display: none;">
          <h3>Debug Information</h3>
          <div class="debug-grid">
            <div class="debug-col">
              <h4>Console Log</h4>
              <div id="debug-log" class="debug-log"></div>
            </div>
            <div class="debug-col">
              <h4>Site Content Keys</h4>
              <div id="content-keys" class="debug-content"></div>
            </div>
          </div>
        </div>
        
        <div class="site-preview">
          ${processedHTML}
          
          <!-- Modal Structure -->
          <div id="modal" class="modal">
            <div class="modal-content">
              <span class="close-button" onclick="closeModal()">×</span>
              <div id="modal-title"></div>
              <div id="modal-content"></div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Sample site content for the modal
        window.siteContent = ${JSON.stringify(sampleData)};
        ${modalFunctions}
        
        // Debug panel functionality
        document.addEventListener('DOMContentLoaded', function() {
          // Debug panel toggle
          const toggleButton = document.getElementById('toggle-debug');
          const debugPanel = document.getElementById('debug-panel');
          
          if (toggleButton && debugPanel) {
            toggleButton.addEventListener('click', function() {
              const isVisible = debugPanel.style.display !== 'none';
              debugPanel.style.display = isVisible ? 'none' : 'block';
              toggleButton.textContent = isVisible ? 'Show Debug Panel' : 'Hide Debug Panel';
              logDebug(isVisible ? 'Debug panel hidden' : 'Debug panel shown');
            });
          }
          
          // Check site content button
          const checkContentButton = document.getElementById('check-content');
          if (checkContentButton) {
            checkContentButton.addEventListener('click', function() {
              logDebug('Manual content check triggered');
              const result = checkSiteContent();
              if (result) {
                // Show content keys
                const contentKeysElement = document.getElementById('content-keys');
                if (contentKeysElement) {
                  const keys = Object.keys(window.siteContent);
                  contentKeysElement.innerHTML = keys.map(key => {
                    const value = window.siteContent[key];
                    const shortValue = typeof value === 'string' 
                      ? value.substring(0, 30) + (value.length > 30 ? '...' : '')
                      : String(value);
                    return `<div class="log-entry"><strong>${key}</strong>: ${shortValue}</div>`;
                  }).join('');
                }
              }
            });
          }
          
          // Dump content to console button
          const dumpContentButton = document.getElementById('dump-content');
          if (dumpContentButton) {
            dumpContentButton.addEventListener('click', function() {
              logDebug('Dumping full content to console');
              console.log('SITE CONTENT:', window.siteContent);
              alert('Content dumped to browser console. Press F12 to view.');
            });
          }
          
          // Check for common issues
          setTimeout(() => {
            checkCommonIssues();
          }, 1000);
        });
        
        // Check for common rendering issues
        function checkCommonIssues() {
          try {
            logDebug('Checking for common rendering issues...');
            
            // 1. Check if modal exists
            const modal = document.getElementById('modal');
            if (!modal) {
              logDebug('ERROR: Modal element not found in DOM');
            } else {
              logDebug('Modal element found in DOM');
            }
            
            // 2. Check if all social cards exist
            const cards = document.querySelectorAll('.social-card');
            logDebug(`Found ${cards.length} social cards in the DOM`);
            
            // 3. Check if siteContent has all expected keys for social media posts
            if (window.siteContent) {
              const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
              const missingKeys = [];
              
              for (const platform of platforms) {
                for (let i = 1; i <= 4; i++) {
                  const titleKey = `${platform}_title_${i}`;
                  const contentKey = `${platform}_post_${i}`;
                  
                  if (!window.siteContent[titleKey]) {
                    missingKeys.push(titleKey);
                  }
                  
                  if (!window.siteContent[contentKey]) {
                    missingKeys.push(contentKey);
                  }
                }
              }
              
              if (missingKeys.length > 0) {
                logDebug(`WARNING: Missing ${missingKeys.length} expected keys in siteContent`, missingKeys);
              } else {
                logDebug('All expected keys found in siteContent');
              }
            }
            
            // 4. Check for MongoDB connection issues
            logDebug('NOTE: If you\'re experiencing issues with posting, it may be related to the MongoDB connection.');
            logDebug('The current MongoDB connection string is from the .env file: mongodb+srv://vicsicard:[password]@cluster0.9uspndx.mongodb.net/selfcast');
            logDebug('Verify the MongoDB connection is working properly.');
            
            logDebug('Common issues check completed');
          } catch (error) {
            console.error('Error checking common issues:', error);
            logDebug(`Error checking common issues: ${error.message}`);
          }
        }
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error generating social preview:', error);
    res.status(500).send(`Error generating preview: ${error.message}`);
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

/**
 * GET /api/debug/create-test-site/:projectId
 * Create a simple test site for a project
 */
router.get('/create-test-site/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(SITES_DIR, projectId);
    
    // Create project directory
    await fs.mkdir(projectDir, { recursive: true });
    
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

module.exports = router;
