/**
 * Supabase to MongoDB Migration Script
 * 
 * This script extracts data from Supabase and imports it into MongoDB.
 * It serves as a data bridge between the two systems.
 * 
 * Usage: node src/utils/supabase-to-mongodb.js [projectId]
 * If projectId is provided, only that project will be migrated.
 * Otherwise, all projects will be migrated.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const Project = require('../models/Project');

// Supabase configuration
const SUPABASE_URL = 'https://aqicztygjpmunfljjuto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaWN6dHlnanBtdW5mbGpqdXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDU1ODIsImV4cCI6MjA1OTI4MTU4Mn0.5e2hvTckSSbTFLBjQiccrvjoBd6QQDX0X4tccFOc1rs';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Get all project IDs from Supabase
const getProjectIds = async () => {
  try {
    console.log('Fetching project IDs from Supabase...');
    const { data, error } = await supabase
      .from('dynamic_content')
      .select('project_id')
      .order('project_id');
    
    if (error) throw error;
    
    // Get unique project IDs
    const projectIds = [...new Set(data.map(item => item.project_id))];
    console.log(`Found ${projectIds.length} unique projects`);
    
    return projectIds;
  } catch (error) {
    console.error('Error fetching project IDs:', error);
    process.exit(1);
  }
};

// Get content for a specific project from Supabase
const getProjectContent = async (projectId) => {
  try {
    console.log(`Fetching content for project: ${projectId}`);
    const { data, error } = await supabase
      .from('dynamic_content')
      .select('*')
      .eq('project_id', projectId);
    
    if (error) throw error;
    
    console.log(`Found ${data.length} content items`);
    return data;
  } catch (error) {
    console.error(`Error fetching content for project ${projectId}:`, error);
    return null;
  }
};

// Transform Supabase data to MongoDB format
const transformData = (projectId, contentItems) => {
  // Create MongoDB document structure
  const mongoData = {
    projectId,
    content: contentItems.map(item => ({
      key: item.key,
      value: item.value || ''
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return mongoData;
};

// Save project to MongoDB
const saveToMongoDB = async (projectData) => {
  try {
    // Check if project already exists
    const existingProject = await Project.findOne({ projectId: projectData.projectId });
    
    if (existingProject) {
      console.log(`Project "${projectData.projectId}" already exists in MongoDB. Updating...`);
      existingProject.content = projectData.content;
      existingProject.updatedAt = new Date();
      await existingProject.save();
      return { status: 'updated', projectId: projectData.projectId };
    } else {
      console.log(`Creating new project "${projectData.projectId}" in MongoDB...`);
      await Project.create(projectData);
      return { status: 'created', projectId: projectData.projectId };
    }
  } catch (error) {
    console.error(`Error saving project ${projectData.projectId} to MongoDB:`, error);
    return { status: 'error', projectId: projectData.projectId, error: error.message };
  }
};

// Migrate a single project
const migrateProject = async (projectId) => {
  console.log(`\n=== Migrating project: ${projectId} ===`);
  
  // Get content from Supabase
  const contentItems = await getProjectContent(projectId);
  
  if (!contentItems || contentItems.length === 0) {
    console.log(`No content found for project ${projectId}. Skipping.`);
    return { status: 'skipped', projectId, reason: 'No content found' };
  }
  
  // Transform data
  const mongoData = transformData(projectId, contentItems);
  
  // Save to MongoDB
  const result = await saveToMongoDB(mongoData);
  
  return result;
};

// Migrate all projects
const migrateAllProjects = async () => {
  // Get all project IDs
  const projectIds = await getProjectIds();
  
  console.log(`\n=== Starting migration of ${projectIds.length} projects ===\n`);
  
  const results = {
    total: projectIds.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  // Migrate each project
  for (const projectId of projectIds) {
    const result = await migrateProject(projectId);
    results.details.push(result);
    
    // Update stats
    if (result.status === 'created') results.created++;
    else if (result.status === 'updated') results.updated++;
    else if (result.status === 'skipped') results.skipped++;
    else if (result.status === 'error') results.errors++;
  }
  
  return results;
};

// Set up scheduled migration
const setupScheduledMigration = (intervalMinutes) => {
  console.log(`Setting up scheduled migration every ${intervalMinutes} minutes`);
  
  // Run initial migration
  migrateAllProjects()
    .then(results => {
      console.log('\n=== Initial migration complete ===');
      console.log(`Total projects: ${results.total}`);
      console.log(`Created: ${results.created}`);
      console.log(`Updated: ${results.updated}`);
      console.log(`Skipped: ${results.skipped}`);
      console.log(`Errors: ${results.errors}`);
    });
  
  // Schedule recurring migrations
  setInterval(async () => {
    console.log('\n=== Running scheduled migration ===');
    const results = await migrateAllProjects();
    console.log('\n=== Scheduled migration complete ===');
    console.log(`Total projects: ${results.total}`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);
  }, intervalMinutes * 60 * 1000);
};

// Main execution
(async () => {
  // Connect to MongoDB
  const conn = await connectMongoDB();
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    if (args[0] === '--schedule') {
      // Schedule recurring migrations
      const intervalMinutes = parseInt(args[1]) || 60; // Default to 60 minutes
      setupScheduledMigration(intervalMinutes);
    } else {
      // Migrate specific project
      const projectId = args[0];
      console.log(`Migrating single project: ${projectId}`);
      const result = await migrateProject(projectId);
      console.log(`Migration result: ${result.status}`);
      
      // Close MongoDB connection
      await conn.connection.close();
      console.log('MongoDB connection closed');
    }
  } else {
    // Migrate all projects once
    console.log('Migrating all projects...');
    const results = await migrateAllProjects();
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total projects: ${results.total}`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);
    
    // Close MongoDB connection
    await conn.connection.close();
    console.log('MongoDB connection closed');
  }
})().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
