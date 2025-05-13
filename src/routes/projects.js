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
    
    // Generate the static site
    const result = await generateSite(projectId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to generate site'
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate site'
    });
  }
});

module.exports = router;
