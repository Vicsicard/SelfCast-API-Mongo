/**
 * Fix Script.js
 * 
 * This script updates the script.js file in the standard template to properly
 * load content from the MongoDB API instead of Supabase.
 */

const fs = require('fs');
const path = require('path');

// Path to the script.js file
const scriptPath = path.join(__dirname, 'templates', 'standard', 'script.js');

// Read the current script
try {
  console.log(`Reading script file: ${scriptPath}`);
  let scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Create a backup of the original script
  const backupPath = path.join(__dirname, 'templates', 'standard', 'script.js.bak');
  fs.writeFileSync(backupPath, scriptContent);
  console.log(`Created backup of original script at: ${backupPath}`);
  
  // Update the loadContent function to use the MongoDB API
  const oldLoadContentFunction = `// Load and inject content
async function loadContent() {
    try {
        const projectId = getProjectId();
        console.log('Loading content for project:', projectId);

        // Fetch all content from Supabase
        const { data: contentData, error: contentError } = await supabase
            .from('dynamic_content')
            .select('*')
            .eq('project_id', projectId);

        if (contentError) throw contentError;
        console.log('Content data:', contentData);`;

  const newLoadContentFunction = `// Load and inject content
async function loadContent() {
    try {
        const projectId = getProjectId();
        console.log('Loading content for project:', projectId);

        // Check if we already have content pre-loaded in the window.siteContent object
        if (window.siteContent && Object.keys(window.siteContent).length > 0) {
            console.log('Using pre-loaded content from window.siteContent');
            // Convert the pre-loaded content to the expected format
            const contentData = Object.entries(window.siteContent).map(([key, value]) => ({
                key,
                value
            }));
            processContentData(contentData);
            return;
        }

        // Fetch content from MongoDB API
        const apiUrl = \`\${window.location.origin}/api/projects/\${projectId}/content\`;
        console.log('Fetching content from:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(\`Failed to fetch content: \${response.status} \${response.statusText}\`);
        }
        
        const contentData = await response.json();
        console.log('Content data:', contentData);
        
        // Process the content data
        processContentData(contentData);
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Process content data and update the UI
function processContentData(contentData) {
    // Convert array to object for theme styles
    const themeData = {};
    contentData.forEach(item => {
        themeData[item.key] = item.value;
    });

    // Load fonts and inject styles
    loadFonts(themeData.heading_font || 'Roboto', themeData.body_font || 'Open Sans');
    injectStyles(themeData);`;

  // Replace the old loadContent function with the new one
  scriptContent = scriptContent.replace(oldLoadContentFunction, newLoadContentFunction);
  
  // Update the content processing code to use the new processContentData function
  const oldContentProcessing = `        // Process each content item and store for modal use
        contentData.forEach(item => {
            // Store content for modal use
            window.siteContent[item.key] = item.value;`;
            
  const newContentProcessing = `    // Process each content item and store for modal use
    contentData.forEach(item => {
        // Store content for modal use
        window.siteContent[item.key] = item.value;`;
  
  scriptContent = scriptContent.replace(oldContentProcessing, newContentProcessing);
  
  // Fix the closing of the loadContent function
  const oldLoadContentClosing = `    } catch (error) {
        console.error('Error loading content:', error);
    }
}`;

  const newLoadContentClosing = `}`;
  
  scriptContent = scriptContent.replace(oldLoadContentClosing, newLoadContentClosing);
  
  // Write the updated script back to the file
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('Successfully updated script.js to use MongoDB API');
} catch (error) {
  console.error('Error updating script.js:', error);
}

console.log('Script update process complete');
