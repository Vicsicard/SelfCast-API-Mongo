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
