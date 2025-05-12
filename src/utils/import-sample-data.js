/**
 * Sample Data Import Utility
 * 
 * This script imports sample project data into MongoDB.
 * Usage: node src/utils/import-sample-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');

// Load sample data
const loadSampleData = () => {
  try {
    const dataPath = path.join(__dirname, '../../sample-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return data;
  } catch (error) {
    console.error('Error loading sample data:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Import data to database
const importData = async () => {
  try {
    const data = loadSampleData();
    
    // Check if project already exists
    const existingProject = await Project.findOne({ projectId: data.projectId });
    
    if (existingProject) {
      console.log(`Project with ID "${data.projectId}" already exists. Updating content...`);
      existingProject.content = data.content;
      await existingProject.save();
      console.log('Project updated successfully');
    } else {
      // Create new project
      await Project.create(data);
      console.log(`Project "${data.projectId}" imported successfully`);
    }
    
    console.log('Data import complete!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

// Main execution
(async () => {
  // Connect to MongoDB
  const conn = await connectDB();
  
  // Import data
  await importData();
  
  // Disconnect from MongoDB
  await conn.connection.close();
  console.log('MongoDB connection closed');
})();
