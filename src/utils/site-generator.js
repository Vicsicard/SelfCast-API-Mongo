/**
 * Static Site Generator for SelfCast Dynamic
 * 
 * Generates static HTML sites based on project content and templates
 * Uses the existing template structure from SelfCast Dynamic
 */

const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/Project');

// Base templates directory
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
// Output directory for generated sites
const OUTPUT_DIR = path.join(__dirname, '../../public/sites');
// Default template style
const DEFAULT_TEMPLATE = 'standard';

/**
 * Generate a static site for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Result object with site URL and status
 */
async function generateSite(projectId) {
  try {
    // Ensure output directory exists
    await fs.mkdir(path.join(OUTPUT_DIR, projectId), { recursive: true });
    
    // Get project content from database
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // Convert content array to a more usable object
    const contentMap = {};
    project.content.forEach(item => {
      contentMap[item.key] = item.value;
    });
    
    // Add current year to content
    contentMap.current_year = new Date().getFullYear().toString();
    
    // Determine template style (use standard as default)
    let templateStyle = contentMap.style_package || DEFAULT_TEMPLATE;
    let templateDir = path.join(TEMPLATES_DIR, templateStyle);
    
    // Check if the template directory exists, if not, fall back to standard
    try {
      await fs.access(templateDir);
    } catch (error) {
      console.log(`Template style '${templateStyle}' not found, falling back to standard template`);
      templateStyle = 'standard';
      templateDir = path.join(TEMPLATES_DIR, 'standard');
    }
    
    // Copy template files to output directory
    await copyTemplateFiles(templateDir, path.join(OUTPUT_DIR, projectId));
    
    // Read the index.html template
    const indexTemplatePath = path.join(templateDir, 'index.html');
    let indexHtml = await fs.readFile(indexTemplatePath, 'utf8');
    
    // Replace content placeholders in the HTML
    indexHtml = replaceContentPlaceholders(indexHtml, contentMap);
    
    // Write the generated index.html
    await fs.writeFile(path.join(OUTPUT_DIR, projectId, 'index.html'), indexHtml);
    
    // Create a config.js file for the site
    await generateConfigJs(path.join(OUTPUT_DIR, projectId), projectId);
    
    // Determine the site URL
    const isProduction = process.env.NODE_ENV === 'production';
    let siteUrl;
    
    if (isProduction) {
      // In production, use the Vercel domain pattern
      siteUrl = `https://self-cast-api-mongo.vercel.app/sites/${projectId}/`;
    } else {
      // For local development
      const port = process.env.PORT || 3000;
      siteUrl = `http://localhost:${port}/sites/${projectId}/`;
    }
    
    return {
      success: true,
      projectId,
      siteUrl,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating site:', error);
    return {
      success: false,
      projectId,
      error: error.message
    };
  }
}

/**
 * Copy template files to the output directory
 * @param {string} templateDir - Source template directory
 * @param {string} outputDir - Destination directory
 * @returns {Promise<void>}
 */
async function copyTemplateFiles(templateDir, outputDir) {
  try {
    // Check if template directory exists
    try {
      await fs.access(templateDir);
    } catch (error) {
      console.error(`Template directory not found: ${templateDir}`);
      throw new Error(`Template directory not found: ${templateDir}`);
    }
    
    // Get list of files in the template directory
    const files = await fs.readdir(templateDir);
    
    // Copy each file to the output directory
    for (const file of files) {
      if (file !== 'index.html') { // We'll process index.html separately
        const sourcePath = path.join(templateDir, file);
        const destPath = path.join(outputDir, file);
        
        try {
          // Get file stats to check if it's a directory
          const stats = await fs.stat(sourcePath);
          
          if (stats.isDirectory()) {
            // Create directory and copy contents recursively
            await fs.mkdir(destPath, { recursive: true });
            await copyTemplateFiles(sourcePath, destPath);
          } else {
            // Copy the file
            await fs.copyFile(sourcePath, destPath);
          }
        } catch (fileError) {
          console.warn(`Error processing file ${sourcePath}:`, fileError);
          // Continue with other files
        }
      }
    }
  } catch (error) {
    console.error('Error copying template files:', error);
    throw error;
  }
}

/**
 * Replace content placeholders in HTML with actual content
 * @param {string} html - HTML template
 * @param {Object} contentMap - Content key-value pairs
 * @returns {string} - Processed HTML
 */
function replaceContentPlaceholders(html, contentMap) {
  // Replace data-key attributes with actual content
  let processedHtml = html;
  
  // Find all data-key attributes and replace them
  const dataKeyRegex = /data-key="([^"]+)"/g;
  let match;
  
  while ((match = dataKeyRegex.exec(html)) !== null) {
    const key = match[1];
    const value = contentMap[key] || '';
    
    // Replace the content of the element with the value
    const elementRegex = new RegExp(`<([^>]+)data-key="${key}"[^>]*>([^<]*)</`, 'g');
    processedHtml = processedHtml.replace(elementRegex, (match, p1, p2) => {
      return `<${p1}data-key="${key}">${value}</`;
    });
  }
  
  // Replace window.siteContent with the content map
  processedHtml = processedHtml.replace(
    /window\.siteContent = \{[^\}]*\};/,
    `window.siteContent = ${JSON.stringify(contentMap)};`
  );
  
  return processedHtml;
}

/**
 * Generate a config.js file for the static site
 * @param {string} outputDir - Output directory
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
async function generateConfigJs(outputDir, projectId) {
  const configJs = `// SelfCast Dynamic - Static Site Configuration
// Generated on ${new Date().toISOString()}

window.SUPABASE_CONFIG = {
  url: 'https://aqicztygjpmunfljjjuto.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaWN6dHlnanBtdW5mbGpqdXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDU1ODIsImV4cCI6MjA1OTI4MTU4Mn0.5e2hvTckSSbTFLBjQiccrvjoBd6QQDX0X4tccFOc1rs'
};

window.PROJECT_ID = '${projectId}';

// This is a static site - no API calls will be made
window.IS_STATIC = true;
`;
  
  await fs.writeFile(path.join(outputDir, 'config.js'), configJs);
}

module.exports = {
  generateSite
};
