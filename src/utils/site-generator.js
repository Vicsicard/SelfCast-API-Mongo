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
    console.log(`Starting site generation for project: ${projectId}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    
    // Ensure output directory exists
    await fs.mkdir(path.join(OUTPUT_DIR, projectId), { recursive: true });
    console.log(`Created output directory: ${path.join(OUTPUT_DIR, projectId)}`);
    
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
    
    // Debug: Log all content keys and values
    console.log('Content keys from database:', project.content.map(item => item.key));
    console.log('Content map created:', Object.keys(contentMap));
    
    // Map rendered fields to their expected names in the template if needed
    if (contentMap.rendered_title && !contentMap.title) {
      contentMap.title = contentMap.rendered_title;
    }
    
    if (contentMap.rendered_subtitle && !contentMap.subtitle) {
      contentMap.subtitle = contentMap.rendered_subtitle;
    }
    
    if (contentMap.rendered_bio_html && !contentMap.bio_html) {
      contentMap.bio_html = contentMap.rendered_bio_html;
    }
    
    // Add current year to content
    contentMap.current_year = new Date().getFullYear().toString();
    
    // Always use the standard template for now
    // let templateStyle = contentMap.style_package || DEFAULT_TEMPLATE;
    let templateStyle = 'standard';
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
    await copyTemplateFiles(templateDir, path.join(OUTPUT_DIR, projectId), contentMap);
    
    // Read the index.html template
    const indexTemplatePath = path.join(templateDir, 'index.html');
    let indexHtml = await fs.readFile(indexTemplatePath, 'utf8');
    
    // Replace content placeholders in the HTML
    indexHtml = replaceContentPlaceholders(indexHtml, contentMap);
    
    // Write the generated index.html
    await fs.writeFile(path.join(OUTPUT_DIR, projectId, 'index.html'), indexHtml);
    
    // Create a config.js file for the site with the content map
    await generateConfigJs(path.join(OUTPUT_DIR, projectId), projectId, contentMap);
    
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
    
    console.log(`Site generation completed successfully for project: ${projectId}`);
    console.log(`Site URL: ${siteUrl}`);
    
    return {
      success: true,
      message: `Site generated successfully for project: ${projectId}`,
      url: siteUrl,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating site for ${projectId}:`, error);
    console.error('Stack trace:', error.stack);
    
    // Check if the output directory exists
    try {
      const outputDirExists = await fs.access(OUTPUT_DIR)
        .then(() => true)
        .catch(() => false);
      
      console.log(`Output directory exists: ${outputDirExists}`);
      
      if (!outputDirExists) {
        console.log('Attempting to create output directory...');
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
      }
      
      // Check if the project directory exists
      const projectDirExists = await fs.access(path.join(OUTPUT_DIR, projectId))
        .then(() => true)
        .catch(() => false);
      
      console.log(`Project directory exists: ${projectDirExists}`);
      
      if (!projectDirExists) {
        console.log('Attempting to create project directory...');
        await fs.mkdir(path.join(OUTPUT_DIR, projectId), { recursive: true });
        console.log(`Created project directory: ${path.join(OUTPUT_DIR, projectId)}`);
      }
    } catch (dirError) {
      console.error('Error checking/creating directories:', dirError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Copy template files to the output directory
 * @param {string} templateDir - Source template directory
 * @param {string} outputDir - Destination directory
 * @param {Object} contentMap - Content map for the project
 * @returns {Promise<void>}
 */
async function copyTemplateFiles(templateDir, outputDir, contentMap) {
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
            await copyTemplateFiles(sourcePath, destPath, contentMap);
          } else if (file === 'script.js') {
            // Use our custom static script.js instead of the template one
            console.log('Using custom static script.js instead of template script.js');
            const staticScriptPath = path.join(__dirname, 'static-script.js');
            
            try {
              // Check if our static script exists
              await fs.access(staticScriptPath);
              // Copy our static script instead of the template one
              await fs.copyFile(staticScriptPath, destPath);
              console.log('Copied static script.js successfully');
            } catch (scriptError) {
              console.warn('Static script not found, using template script:', scriptError);
              // Fall back to the template script if our static script doesn't exist
              await fs.copyFile(sourcePath, destPath);
            }
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
  console.log('Replacing content placeholders with content map:', Object.keys(contentMap));
  
  // Replace data-key attributes with actual content
  let processedHtml = html;
  
  // First, ensure window.siteContent is properly set with all content
  processedHtml = processedHtml.replace(
    /window\.siteContent\s*=\s*\{[^\}]*\};/,
    `window.siteContent = ${JSON.stringify(contentMap)};`
  );
  
  // Log the keys we're looking for in the template
  console.log('Content keys available:', Object.keys(contentMap));
  
  // Handle specific content types that need special processing
  // Profile image - try multiple possible field names
  const profileImageUrl = contentMap.profile_image_url || contentMap.profile_image || contentMap.avatar_url || '';
  if (profileImageUrl) {
    console.log('Found profile image URL:', profileImageUrl);
    // Replace img src attributes for profile images
    processedHtml = processedHtml.replace(
      /<img[^>]*class="profile-image"[^>]*src="[^"]*"[^>]*>/g,
      `<img class="profile-image" src="${profileImageUrl}" alt="Profile">`
    );
    
    // Also handle any other profile image placeholders
    processedHtml = processedHtml.replace(
      /<img[^>]*data-key="profile_image_url"[^>]*src="[^"]*"[^>]*>/g,
      `<img data-key="profile_image_url" src="${profileImageUrl}" alt="Profile">`
    );
    
    // Also set the profile_image_url in the content map if it doesn't exist
    if (!contentMap.profile_image_url) {
      contentMap.profile_image_url = profileImageUrl;
    }
  }
  
  // Handle title and subtitle
  if (contentMap.title) {
    console.log('Found title:', contentMap.title);
    // Replace title in head
    processedHtml = processedHtml.replace(
      /<title[^>]*>[^<]*<\/title>/,
      `<title>${contentMap.title}</title>`
    );
    
    // Replace h1 with title
    processedHtml = processedHtml.replace(
      /<h1[^>]*>[^<]*<\/h1>/,
      `<h1>${contentMap.title}</h1>`
    );
  }
  
  if (contentMap.subtitle) {
    console.log('Found subtitle:', contentMap.subtitle);
    // Replace subtitle
    processedHtml = processedHtml.replace(
      /<p[^>]*class="subtitle"[^>]*>[^<]*<\/p>/,
      `<p class="subtitle">${contentMap.subtitle}</p>`
    );
  }
  
  // Handle blog posts - try both standard and rendered field names
  for (let i = 1; i <= 4; i++) {
    // Check multiple possible field name patterns
    const possibleTitleKeys = [
      `blog_${i}_title`,
      `blog${i}_title`,
      `rendered_blog_${i}_title`
    ];
    
    const possibleContentKeys = [
      `blog_${i}_content`,
      `blog${i}_content`,
      `rendered_blog_${i}_content`
    ];
    
    // Find the first available title key
    let titleKey = null;
    for (const key of possibleTitleKeys) {
      if (contentMap[key]) {
        titleKey = key;
        break;
      }
    }
    
    // Find the first available content key
    let contentKey = null;
    for (const key of possibleContentKeys) {
      if (contentMap[key]) {
        contentKey = key;
        break;
      }
    }
    
    // Handle blog title
    if (titleKey && contentMap[titleKey]) {
      console.log(`Found blog ${i} title (${titleKey}):`, contentMap[titleKey]);
      // Replace blog post title in various formats
      
      // Format 1: data-blog attribute
      processedHtml = processedHtml.replace(
        new RegExp(`<h3[^>]*data-blog="${i}"[^>]*>[^<]*<\/h3>`, 'g'),
        `<h3 data-blog="${i}">${contentMap[titleKey]}</h3>`
      );
      
      // Format 2: data-key attribute
      processedHtml = processedHtml.replace(
        new RegExp(`<h3[^>]*data-key="blog_${i}_title"[^>]*>[^<]*<\/h3>`, 'g'),
        `<h3 data-key="blog_${i}_title">${contentMap[titleKey]}</h3>`
      );
    }
    
    // Handle blog content
    if (contentKey && contentMap[contentKey]) {
      console.log(`Found blog ${i} content (${contentKey}, length: ${contentMap[contentKey].length})`);
      
      // Format 1: data-blog-content attribute
      const contentRegex1 = new RegExp(`<p[^>]*data-blog-content="${i}"[^>]*>[^<]*<\/p>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex1,
        `<p data-blog-content="${i}">${contentMap[contentKey]}</p>`
      );
      
      // Format 2: data-key attribute
      const contentRegex2 = new RegExp(`<p[^>]*data-key="blog_${i}_content"[^>]*>[^<]*<\/p>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex2,
        `<p data-key="blog_${i}_content">${contentMap[contentKey]}</p>`
      );
      
      // Format 3: div with data-key attribute (for longer content)
      const contentRegex3 = new RegExp(`<div[^>]*data-key="blog_${i}_content"[^>]*>[^<]*<\/div>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex3,
        `<div data-key="blog_${i}_content">${contentMap[contentKey]}</div>`
      );
    }
  }
  
  // Find all data-key attributes and replace them
  const dataKeyRegex = /data-key="([^"]+)"/g;
  let match;
  
  while ((match = dataKeyRegex.exec(html)) !== null) {
    const key = match[1];
    const value = contentMap[key] || '';
    
    console.log(`Replacing data-key="${key}" with value: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
    
    // Replace the content of the element with the value
    const elementRegex = new RegExp(`<([^>]+)data-key="${key}"[^>]*>([^<]*)</`, 'g');
    processedHtml = processedHtml.replace(elementRegex, (match, p1, p2) => {
      return `<${p1}data-key="${key}">${value}</`;
    });
  }
  
  return processedHtml;
}

/**
 * Generate a config.js file for the static site
 * @param {string} outputDir - Output directory
 * @param {string} projectId - Project ID
 * @param {Object} contentMap - Content map for the project
 * @returns {Promise<void>}
 */
async function generateConfigJs(outputDir, projectId, contentMap) {
  try {
    console.log('Generating config.js for static site');
    
    // Create a simplified config without Supabase dependencies
    // Include the content map directly in the config.js file
    const configContent = `// Static site configuration
// This is a static site with pre-embedded content
// No Supabase connection is needed

// Mock Supabase config to prevent errors
const SUPABASE_CONFIG = {
  url: 'https://static-site-no-supabase-needed',
  key: 'static-site-no-supabase-needed'
};

// Project ID
const PROJECT_ID = '${projectId}';

// Pre-embedded content
window.siteContent = ${JSON.stringify(contentMap, null, 2)};

// Mock Supabase client to prevent errors
window.supabase = {
  createClient: function() {
    console.log('Static site loaded - all content pre-embedded');
    return {
      from: function() {
        return {
          select: function() {
            return this;
          },
          eq: function() {
            return this;
          },
          then: function(callback) {
            // Return pre-embedded content
            callback({
              data: [],
              error: null
            });
            return this;
          }
        };
      }
    };
  }
};

// Initialize site when loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Static site initialized with pre-embedded content');
});
`;
    
    await fs.writeFile(path.join(outputDir, 'config.js'), configContent);
    console.log('Generated config.js successfully');
  } catch (error) {
    console.error('Error generating config.js:', error);
    throw error;
  }
}

module.exports = {
  generateSite
};
