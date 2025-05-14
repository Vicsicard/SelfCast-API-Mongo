/**
 * Update Render Branch Script
 * 
 * This script updates the render.yaml file to explicitly use the combined branch
 * for deployment, ensuring all the latest fixes are included.
 */

const fs = require('fs');
const path = require('path');

// Path to render.yaml
const renderYamlPath = path.join(__dirname, 'render.yaml');

// Read the current render.yaml content
try {
  let renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
  
  // Check if the branch is already specified
  if (!renderYaml.includes('branch:')) {
    // Add the branch specification after the plan: line
    renderYaml = renderYaml.replace(
      /plan: free/,
      'plan: free\n    branch: combined'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(renderYamlPath, renderYaml);
    console.log('✅ Successfully updated render.yaml to use the combined branch');
  } else {
    // Update the existing branch specification
    renderYaml = renderYaml.replace(
      /branch: [^\n]+/,
      'branch: combined'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(renderYamlPath, renderYaml);
    console.log('✅ Successfully updated existing branch in render.yaml to combined');
  }
} catch (error) {
  console.error('❌ Error updating render.yaml:', error);
}

// Create a README file explaining the branch structure
const readmePath = path.join(__dirname, 'BRANCH-INFO.md');
const readmeContent = `# SelfCast API MongoDB Branch Information

## Branch Structure

This project uses the following branch structure:

- **main**: The main production branch
- **render-subhost**: Original branch for Render deployment (deprecated)
- **added-image-banners**: Branch with image banner functionality
- **combined**: Current production branch that combines all features

## Current Deployment

The application is currently deployed from the **combined** branch, which includes:

1. All fixes for social media titles and content display
2. Image banner functionality
3. Improved error handling and site generation
4. Custom domain support (user.selfcaststudios.com)

## Deployment Instructions

When deploying to Render:

1. Make sure the deployment is set to use the **combined** branch
2. Verify all environment variables are correctly set in Render
3. Check that the MongoDB connection string is valid

## Troubleshooting

If you encounter issues with the Content Editor:

1. Check the browser console for errors
2. Verify the API URL is correctly set to use the custom domain
3. Make sure the MongoDB connection is working
4. Check that the site generation process is completing successfully

Last updated: ${new Date().toISOString().split('T')[0]}
`;

try {
  fs.writeFileSync(readmePath, readmeContent);
  console.log('✅ Created BRANCH-INFO.md with branch structure information');
} catch (error) {
  console.error('❌ Error creating BRANCH-INFO.md:', error);
}

console.log('🚀 Branch update process complete');
