/**
 * Project Routes for SelfCast Dynamic MVP
 * 
 * Simplified routes that maintain compatibility with the current key-value system.
 */

const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { generateSite } = require('../utils/site-generator');

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
 * Alternative endpoint to get content in key-value format
 * that directly matches Supabase response format
 */
router.get('/:projectId/content', async (req, res) => {
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
    
    // Format response to exactly match Supabase format
    const content = project.content.map(item => ({
      project_id: projectId,
      key: item.key,
      value: item.value
    }));
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content' 
    });
  }
});

/**
 * POST /api/projects/:projectId/content
 * Update or create content items for a project
 */
router.post('/:projectId/content', async (req, res) => {
  try {
    const { projectId } = req.params;
    const contentItems = req.body;
    
    // Validate input
    if (!Array.isArray(contentItems)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content items must be an array' 
      });
    }
    
    // Find or create project
    let project = await Project.findOne({ projectId });
    
    if (!project) {
      // Create new project if it doesn't exist
      project = new Project({
        projectId,
        content: []
      });
    }
    
    // Process each content item
    for (const item of contentItems) {
      if (!item.key) {
        continue; // Skip items with no key
      }
      
      // Find existing content item with the same key
      const existingItemIndex = project.content.findIndex(
        contentItem => contentItem.key === item.key
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        project.content[existingItemIndex].value = item.value;
      } else {
        // Add new item
        project.content.push({
          key: item.key,
          value: item.value || ''
        });
      }
    }
    
    // Save project
    await project.save();
    
    res.json({ 
      success: true, 
      message: 'Content updated successfully',
      project_id: projectId,
      updated: contentItems.length
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update content' 
    });
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
    
    // Generate the site
    const result = await generateSite(projectId);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate site'
    });
  }
});

/**
 * GET /api/projects/:projectId/site
 * Serve or regenerate a site if it doesn't exist
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

module.exports = router;
