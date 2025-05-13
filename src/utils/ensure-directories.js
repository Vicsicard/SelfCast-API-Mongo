/**
 * Utility script to ensure all necessary directories exist
 * Used during the build process on Render
 */

const fs = require('fs');
const path = require('path');

// Directories to ensure exist
const directories = [
  path.join(__dirname, '../../public/sites'),
  path.join(__dirname, '../../public/uploads'),
  path.join(__dirname, '../../public/images')
];

// Create directories if they don't exist
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created successfully: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('All directories have been created successfully!');
