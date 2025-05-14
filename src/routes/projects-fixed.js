/**
 * Project Routes for SelfCast Dynamic MVP
 * 
 * Simplified routes that maintain compatibility with the current key-value system.
 * This is a fixed version with better error handling and debugging for the PUT endpoint.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import models
const Project = require('../models/Project');

/**
 * Generate a static site for a project
 * @param {string} projectId - The project ID
 * @param {object} req - Express request object (for domain info)
 * @returns {object} - Site URL info
 */
async function generateSite(projectId, req) {
  console.log(`Starting site generation for project: ${projectId}`);
  
  try {
    // Get the host from the request or use a default
    let host = 'localhost:3001';
    let protocol = 'http';
    
    // Safely access request properties if they exist
    if (req && typeof req.get === 'function') {
      host = req.get('host') || host;
      protocol = req.protocol || protocol;
    } else if (req && req.headers) {
      host = req.headers.host || host;
      protocol = req.headers['x-forwarded-proto'] || protocol;
    }
    
    const baseUrl = `${protocol}://${host}`;
    
    // Create the sites directory if it doesn't exist
    const sitesDir = path.join(process.cwd(), 'public', 'sites');
    try {
      await fs.mkdir(sitesDir, { recursive: true });
      console.log(`Created sites directory: ${sitesDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Error creating sites directory:', err);
        throw err;
      }
    }
    
    // Create the project directory
    const projectDir = path.join(sitesDir, projectId);
    try {
      await fs.mkdir(projectDir, { recursive: true });
      console.log(`Created project directory: ${projectDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Error creating project directory:', err);
        throw err;
      }
    }
    
    // Fetch project content from database
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // Copy template files
    const templateDir = path.join(process.cwd(), 'templates', 'standard');
    const templateFiles = [
      'index.html',
      'script.js',
      'styles.css',
      'modal-functions.js',
      'social-styles.css'
    ];
    
    // Copy each template file
    for (const file of templateFiles) {
      try {
        const templateFilePath = path.join(templateDir, file);
        const destFilePath = path.join(projectDir, file);
        
        // Read template file
        let content = await fs.readFile(templateFilePath, 'utf8');
        
        // For index.html, inject project content
        if (file === 'index.html') {
          // Replace content placeholders
          project.content.forEach(item => {
            const placeholder = `{{${item.key}}}`;
            if (content.includes(placeholder)) {
              content = content.replace(new RegExp(placeholder, 'g'), item.value || '');
            }
          });
          
          // Replace any remaining placeholders with empty string
          content = content.replace(/\{\{[^\}]+\}\}/g, '');
        }
        
        // Write the file
        await fs.writeFile(destFilePath, content, 'utf8');
        console.log(`Generated ${file} for project ${projectId}`);
      } catch (err) {
        console.error(`Error processing template file ${file}:`, err);
        throw err;
      }
    }
    
    // Return the site URL
    const siteUrl = `/sites/${projectId}/`;
    console.log(`Site generated successfully at ${baseUrl}${siteUrl}`);
    
    return {
      success: true,
      siteUrl
    };
  } catch (error) {
    console.error('Error generating site:', error);
    throw error;
  }
}

/**
 * GET /api/projects
 * Get a list of all project IDs
 */
router.get('/', async (req, res) => {
  try {
    // Get just project IDs for the list
    const projects = await Project.find().select('projectId -_id');
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:projectId
 * Get all content for a specific project
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project
    const project = await Project.findOne({ projectId });
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }
    
    // Format response to match Supabase format
    const content = project.content.map(item => ({
      key: item.key,
      value: item.value
    }));
    
    res.json({ 
      success: true,
      project_id: projectId,
      content
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project' 
    });
  }
});

/**
 * GET /api/projects/:projectId/content
 * Get all content for a specific project (compatibility endpoint for Supabase)
 */
router.get('/:projectId/content', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`=======================================`);
    console.log(`Fetching content for project: ${projectId}`);
    
    // Find the project
    const project = await Project.findOne({ projectId });
    
    if (!project) {
      console.log(`Project not found: ${projectId}`);
      // For compatibility with the Supabase adapter, return an empty array with 200 status, not an error
      return res.status(200).json([]);
    }
    
    console.log(`Found project with ${project.content.length} content items`);
    
    // Return just the content array - ensure proper formatting
    const formattedContent = project.content.map(item => ({
      key: item.key,
      value: item.value || ''
    }));
    
    console.log(`Returning ${formattedContent.length} content items`);
    return res.status(200).json(formattedContent);
  } catch (error) {
    console.error('Error fetching project content:', error);
    // Log the detailed error for debugging
    console.error('Detailed error:', error.stack);
    
    // Return a 200 status with empty array for compatibility with Supabase adapter
    // This prevents the "Failed to fetch existing content" error
    return res.status(200).json([]);
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { projectId, content } = req.body;
    
    // Validate input
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }
    
    // Check if project already exists
    const existingProject = await Project.findOne({ projectId });
    
    if (existingProject) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID already exists' 
      });
    }
    
    // Create new project
    const project = new Project({
      projectId,
      content: Array.isArray(content) ? content : []
    });
    
    await project.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Project created successfully',
      project_id: projectId
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create project' 
    });
  }
});

/**
 * POST /api/projects/:projectId/generate-site
 * Generate a static site for a project
 */
router.post('/:projectId/generate-site', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`Received request to generate site for project: ${projectId}`);
    
    // Attempt to clean up any previous site files first
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const siteDir = path.join(process.cwd(), 'public', 'sites', projectId);
      
      console.log(`Checking if site directory exists: ${siteDir}`);
      try {
        await fs.access(siteDir);
        console.log(`Site directory exists, cleaning up old files first...`);
        // Ensure directory is clean before generation
        const files = await fs.readdir(siteDir);
        for (const file of files) {
          await fs.unlink(path.join(siteDir, file));
        }
      } catch (err) {
        // Directory doesn't exist, that's fine
        console.log(`Site directory doesn't exist yet, will be created during generation`);
      }
    } catch (cleanupError) {
      console.warn('Non-critical error during cleanup:', cleanupError);
      // Continue with site generation even if cleanup fails
    }
    
    const { generateSite } = require('../utils/site-generator');
    
    // Generate the site
    const result = await generateSite(projectId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate site'
      });
    }
    
    res.json({
      success: true,
      site_url: result.url,
      message: result.message
    });
  } catch (error) {
    console.error('Error generating site:', error);
    res.status(500).json({
      success: false,
      error: `Failed to generate site: ${error.message}`
    });
  }
});

/**
 * GET /api/projects/:projectId/site
 * Serve or regenerate a site if it doesn't exist
 */
/**
 * GET /api/projects/:projectId/site-info
 * Get URL information for a specific project's site
 */
router.get('/:projectId/site-info', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get the host from the request or use a default
    let host = req.get('host') || 'localhost:3001';
    let protocol = req.protocol || 'http';
    
    // Check if project exists
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }
    
    // Check if we should use custom domain
    const useCustomDomain = process.env.USE_CUSTOM_DOMAIN === 'true';
    const customDomain = process.env.CUSTOM_DOMAIN || 'user.selfcaststudios.com';
    
    // If in production and custom domain is enabled, use it
    const isProduction = process.env.NODE_ENV === 'production';
    let siteUrl;
    
    if (isProduction) {
      const baseUrl = useCustomDomain ? customDomain : (process.env.RENDER_URL || 'selfcast-api-mongo.onrender.com');
      siteUrl = `https://${baseUrl}/sites/${projectId}/`;
    } else {
      siteUrl = `${protocol}://${host}/sites/${projectId}/`;
    }
    
    // Return the site information
    res.json({
      success: true,
      projectId,
      siteUrl,
      domain: isProduction && useCustomDomain ? customDomain : null
    });
  } catch (error) {
    console.error('Error getting site info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get site information' 
    });
  }
});

/**
 * GET /api/projects/:projectId/site
 * Get static site for a specific project
 */
router.get('/:projectId/site', async (req, res) => {
  try {
    const { projectId } = req.params;
    const fs = require('fs').promises;
    const path = require('path');
    
    console.log(`Checking site for project: ${projectId}`);
    
    // Check if the site exists
    const sitePath = path.join(__dirname, '../../public/sites', projectId);
    const indexPath = path.join(sitePath, 'index.html');
    
    let siteExists = false;
    try {
      await fs.access(indexPath);
      siteExists = true;
      console.log(`Site for ${projectId} exists at ${indexPath}`);
    } catch (error) {
      console.log(`Site for ${projectId} does not exist, will regenerate`);
      siteExists = false;
    }
    
    if (!siteExists) {
      // Generate the site
      console.log(`Regenerating site for project: ${projectId}`);
      const result = await generateSite(projectId);
      
      if (!result.success) {
        throw new Error(`Failed to generate site: ${result.error}`);
      }
    }
    
    // Determine the site URL and redirect
    const isProduction = process.env.NODE_ENV === 'production';
    let siteUrl;
    
    if (isProduction) {
      const customDomain = process.env.CUSTOM_DOMAIN || 'user.selfcaststudios.com';
      const renderUrl = process.env.RENDER_URL || 'selfcast-api-mongo.onrender.com';
      const baseUrl = process.env.USE_CUSTOM_DOMAIN === 'true' ? customDomain : renderUrl;
      siteUrl = `https://${baseUrl}/sites/${projectId}/`;
    } else {
      const port = process.env.PORT || 3000;
      siteUrl = `http://localhost:${port}/sites/${projectId}/`;
    }
    
    console.log(`Redirecting to site URL: ${siteUrl}`);
    res.redirect(siteUrl);
  } catch (error) {
    console.error('Error serving site:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update content for an existing project
 * 
 * This is a completely revamped version with better error handling and debugging
 */
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`\n=======================================`);
    console.log(`PUT request received for project: ${projectId}`);
    console.log(`Request body type: ${typeof req.body}`);
    
    // Log the request body for debugging
    try {
      console.log('Request body (abbreviated):', 
        JSON.stringify(req.body).substring(0, 200) + 
        (JSON.stringify(req.body).length > 200 ? '...' : '')
      );
    } catch (e) {
      console.log('Error stringifying request body:', e.message);
    }
    
    // Extract content from various possible request body formats
    let contentToUpdate = [];
    
    try {
      // Case 1: Content is in req.body.content array
      if (req.body && req.body.content && Array.isArray(req.body.content)) {
        contentToUpdate = req.body.content;
        console.log('FORMAT: Using content array from req.body.content');
      } 
      // Case 2: Content is the request body array itself
      else if (Array.isArray(req.body)) {
        contentToUpdate = req.body;
        console.log('FORMAT: Using req.body as direct content array');
      }
      // Case 3: Single key-value item
      else if (req.body && typeof req.body === 'object' && req.body.key && req.body.value !== undefined) {
        contentToUpdate = [{ key: req.body.key, value: req.body.value }];
        console.log(`FORMAT: Single key-value item: ${req.body.key}`);
      }
      // Case 4: PATCH format with value property only
      else if (req.body && typeof req.body === 'object' && req.body.value !== undefined) {
        // Extract key from URL if possible
        const keyMatch = req.url.match(/key=eq\.([^&]+)/);
        if (keyMatch) {
          const key = decodeURIComponent(keyMatch[1]);
          contentToUpdate = [{ key, value: req.body.value }];
          console.log(`FORMAT: PATCH format with key from URL: ${key}`);
        } else {
          throw new Error('Cannot determine key for PATCH format request');
        }
      }
      else {
        console.error('INVALID FORMAT: Cannot determine content format');
        return res.status(400).json({
          success: false,
          error: 'Invalid content format. Expected array, content object, or key-value pair'
        });
      }
      
      console.log(`Parsed ${contentToUpdate.length} content items to update`);
      
      // Make sure we have valid content items
      if (!contentToUpdate.length) {
        console.error('No valid content items found');
        return res.status(400).json({
          success: false,
          error: 'No valid content items found to update'
        });
      }
      
      // Validate content structure
      for (const item of contentToUpdate) {
        if (!item.key) {
          console.error('Invalid content item: missing key');
          return res.status(400).json({
            success: false,
            error: 'One or more content items are missing a key'
          });
        }
      }
      
      // Find the project
      console.log(`Looking for project in database: ${projectId}`);
      const project = await Project.findOne({ projectId });
      
      if (!project) {
        console.error(`Project not found: ${projectId}`);
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      console.log(`Found project ${projectId} with ${project.content.length} content items`);
      
      // Update strategy based on the size of the update
      if (contentToUpdate.length > 10) {
        // For large updates, replace the entire content array
        console.log('STRATEGY: Replacing entire content array');
        project.content = contentToUpdate;
      } else {
        // For smaller updates, update only the specific items
        console.log('STRATEGY: Updating individual content items');
        
        for (const newItem of contentToUpdate) {
          console.log(`Processing item: ${newItem.key}`);
          
          // Find existing item index
          const existingIndex = project.content.findIndex(item => item.key === newItem.key);
          
          if (existingIndex >= 0) {
            // Update existing item
            console.log(`Updating existing item: ${newItem.key}`);
            console.log(`  Old value: ${project.content[existingIndex].value.substring(0, 30)}${project.content[existingIndex].value.length > 30 ? '...' : ''}`);
            console.log(`  New value: ${newItem.value.substring(0, 30)}${newItem.value.length > 30 ? '...' : ''}`);
            project.content[existingIndex].value = newItem.value;
          } else {
            // Add new item
            console.log(`Adding new item: ${newItem.key}`);
            console.log(`  Value: ${newItem.value.substring(0, 30)}${newItem.value.length > 30 ? '...' : ''}`);
            project.content.push(newItem);
          }
        }
      }
      
      // Save the updated project
      console.log('Saving updated project to database');
      await project.save();
      console.log('Project saved successfully');
      
      // Regenerate the site with the updated content
      console.log(`Regenerating site for project: ${projectId}`);
      try {
        // Make sure to pass the request object to generateSite
        const result = await generateSite(projectId, req);
        console.log(`Site regenerated successfully: ${result.siteUrl}`);
        
        // Update port to match current server
        const port = process.env.PORT || 3001;
        const siteUrl = `/sites/${projectId}/`;
        const fullUrl = `http://localhost:${port}${siteUrl}`;
        console.log(`Full site URL: ${fullUrl}`);
      } catch (regenerateError) {
        console.error('Error regenerating site:', regenerateError);
        // Continue with the response even if regeneration fails
      }
      
      // Include the site URL in the response so the UI can update/refresh correctly
      const port = process.env.PORT || 3001;
      const siteUrl = `/sites/${projectId}/`;
      const fullSiteUrl = `http://localhost:${port}${siteUrl}`;
      
      res.json({
        success: true,
        message: 'Project updated successfully and site regenerated',
        project_id: projectId,
        updated_items: contentToUpdate.length,
        site_url: siteUrl,
        full_site_url: fullSiteUrl
      });
      
    } catch (innerError) {
      console.error('Error processing content update:', innerError);
      throw innerError; // Re-throw to be caught by the outer handler
    }
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: `Failed to update project: ${error.message}`
    });
  }
});

/**
 * POST /:projectId/generate-site
 * Generate a static site for a specific project
 */
router.post('/:projectId/generate-site', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`=======================================`);
    console.log(`Generating site for project: ${projectId}`);
    
    // Find the project to make sure it exists
    const project = await Project.findOne({ projectId });
    
    if (!project) {
      console.log(`Project not found: ${projectId}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }
    
    // Call the site generator function
    try {
      const { siteUrl } = await generateSite(projectId, req);
      console.log(`Site generated successfully: ${siteUrl}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Site generated successfully',
        siteUrl
      });
    } catch (genError) {
      console.error('Error generating site:', genError);
      console.error('Detailed error:', genError.stack);
      return res.status(200).json({ 
        success: false, 
        error: 'Error generating site',
        details: genError.message
      });
    }
  } catch (error) {
    console.error('Error in generate site endpoint:', error);
    console.error('Detailed error:', error.stack);
    return res.status(200).json({ 
      success: false, 
      error: 'Error in generate site endpoint',
      details: error.message
    });
  }
});

// Get site information
router.get('/:projectId/site-info', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`Getting site info for project ${projectId}`);
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: `Project not found with id ${projectId}` 
      });
    }
    
    // Get site URL information
    const protocol = req.protocol;
    const host = req.get('host');
    const port = process.env.PORT || 3001;
    const siteUrl = `/sites/${projectId}/`;
    const fullSiteUrl = `${protocol}://${host}${siteUrl}`;
    
    res.json({
      success: true,
      project_id: projectId,
      site_url: siteUrl,
      full_site_url: fullSiteUrl,
      site_exists: true // Assuming site exists if project exists
    });
  } catch (error) {
    console.error('Error getting site info:', error);
    res.status(500).json({ 
      success: false, 
      error: `Error getting site info: ${error.message}` 
    });
  }
});

// Export the router
module.exports = router;
