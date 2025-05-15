/**
 * Static Site Generator for SelfCast Dynamic
 * 
 * IMPORTANT: This file has been modified to use a clean template
 * without any hardcoded content. The template now uses placeholders
 * for all content, which are replaced at build time.
 */


const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/Project');
const directSocialTitleFix = require('./direct-social-fix'); // Import the specialized social title fix function

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
    // Check if projectId is a special file name that should not be treated as a project
    const specialFiles = ['config.js', 'script.js', 'style.css', 'social-title-fix.js'];
    if (specialFiles.includes(projectId)) {
      console.log(`Cannot generate site for ${projectId} as it's a special file, not a project ID`);
      return {
        success: false,
        error: `${projectId} is a special file name, not a valid project ID`,
        message: `Cannot generate site for ${projectId}`
      };
    }
    
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
    
    // Convert content array to a more usable object and validate
    const contentMap = {};
    console.log(`Content array has ${project.content.length} items`);
    
    if (!project.content || project.content.length === 0) {
      console.warn(`Warning: No content found for project ${projectId}. Creating minimal default content.`);
      // Add minimal default content to prevent errors
      contentMap.rendered_title = `Site for ${projectId}`;
      contentMap.rendered_subtitle = "Site content being developed";
      contentMap.primary_color = "#3498db";
      contentMap.accent_color = "#2ecc71";
      contentMap.text_color = "#333333";
      contentMap.background_color = "#ffffff";
      contentMap.heading_font = "Roboto";
      contentMap.body_font = "Open Sans";
      contentMap.rendered_bio_html = `<p>Content for ${projectId} is being developed.</p>`;
    } else {
      project.content.forEach(item => {
        if (item && item.key) {
          contentMap[item.key] = item.value;
          console.log(`Processing content item: ${item.key}`);
        } else {
          console.warn('Skipping invalid content item:', item);
        }
      });
    }
    
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
    
    // Map blog_1, blog_2, etc. to rendered_blog_post_1, rendered_blog_post_2 for compatibility
    for (let i = 1; i <= 4; i++) {
      if (contentMap[`blog_${i}`] && !contentMap[`rendered_blog_post_${i}`]) {
        contentMap[`rendered_blog_post_${i}`] = contentMap[`blog_${i}`];
        console.log(`Mapped blog_${i} to rendered_blog_post_${i}`);
      }
    }
    
    // Map social media titles to ensure they're correctly connected between editor and website
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
    socialPlatforms.forEach(platform => {
      for (let i = 1; i <= 4; i++) {
        // Make sure both title_N and title fields are populated
        if (contentMap[`${platform}_title_${i}`]) {
          contentMap[`${platform}_title`] = contentMap[`${platform}_title_1`]; // Use first title as default title
          console.log(`Mapped ${platform}_title_${i} to ${platform}_title`);
        } else if (contentMap[`${platform}_title`] && !contentMap[`${platform}_title_${i}`]) {
          contentMap[`${platform}_title_${i}`] = contentMap[`${platform}_title`];
          console.log(`Mapped ${platform}_title to ${platform}_title_${i}`);
        }
      }
    });
    
    // Make sure banner image fields are properly populated, even if empty
    for (let i = 1; i <= 3; i++) {
      if (!contentMap.hasOwnProperty(`banner_image_${i}_url`)) {
        contentMap[`banner_image_${i}_url`] = "";
        console.log(`Added empty banner_image_${i}_url field`);
      }
    }
    
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
    
    // Post-processing step: Fix banner images that might still have URLs as text
    for (let i = 1; i <= 3; i++) {
      const bannerKey = `banner_image_${i}_url`;
      if (contentMap[bannerKey] && contentMap[bannerKey].trim() !== '') {
        const imgUrl = contentMap[bannerKey];
        
        // Look for banner dividers that still have the URL as text
        const bannerWithTextUrlRegex = new RegExp(`<div[^>]*class="banner-divider banner-divider-${i}"[^>]*data-key="banner_image_${i}_url"[^>]*>\s*${imgUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\s*</div>`, 'g');
        indexHtml = indexHtml.replace(bannerWithTextUrlRegex, `<div class="banner-divider banner-divider-${i}" data-key="banner_image_${i}_url" style="background-image: url('${imgUrl}');"></div>`);
        
        console.log(`Final banner image ${i} post-processing complete`);
      }
    }
    
    // Apply the DIRECT social media title fix for maximum reliability
    console.log('Applying DIRECT social media title fix...');
    indexHtml = directSocialTitleFix(indexHtml, contentMap);
    console.log('DIRECT social media title fix applied');
    
    // Write the generated index.html
    await fs.writeFile(path.join(OUTPUT_DIR, projectId, 'index.html'), indexHtml);
    
    // Generate a config.js file for the site with the content map
    await generateConfigJs(path.join(OUTPUT_DIR, projectId), projectId, contentMap);
    
    // Copy the social-title-fix.js script to ensure titles are displayed correctly
    try {
      const socialTitleFixPath = path.join(TEMPLATES_DIR, 'standard', 'social-title-fix.js');
      const outputSocialTitleFixPath = path.join(OUTPUT_DIR, projectId, 'social-title-fix.js');
      await fs.copyFile(socialTitleFixPath, outputSocialTitleFixPath);
      console.log(`Copied social-title-fix.js to ${outputSocialTitleFixPath}`);
    } catch (error) {
      console.error('Error copying social-title-fix.js:', error);
    }
    
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
            // Always use the template script.js
            console.log('Using template script.js directly');
            await fs.copyFile(sourcePath, destPath);
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
  console.log('USING ENHANCED CLEAN TEMPLATE CONTENT REPLACEMENT');
  console.log('Replacing content placeholders with content map:', Object.keys(contentMap));

  // Replace data-key attributes with actual content
  let processedHtml = html;
  
  // First, make sure the content map has entries for all expected placeholders
  // Even if they're empty, to prevent "undefined" values
  const requiredKeys = [
    'rendered_title', 'rendered_subtitle', 'rendered_bio_html', 'rendered_footer_slogan',
    'client_name', 'client_website', 'current_year',
    'primary_color', 'accent_color', 'text_color', 'background_color',
    'heading_font', 'body_font'
  ];
  
  // Add blog posts
  for (let i = 1; i <= 4; i++) {
    requiredKeys.push(`rendered_blog_post_${i}`);
  }
  
  // Add social media posts
  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  platforms.forEach(platform => {
    for (let i = 1; i <= 4; i++) {
      requiredKeys.push(`${platform}_title_${i}`);
      requiredKeys.push(`${platform}_post_${i}`);
    }
  });
  
  // Ensure all required keys have values
  requiredKeys.forEach(key => {
    if (!contentMap[key]) {
      console.log(`Adding empty placeholder for missing key: ${key}`);
      contentMap[key] = '';
    }
  });
  console.log('Replacing content placeholders with content map:', Object.keys(contentMap));

  // Replace data-key attributes with actual content
  let processedHtml = html;

  // Replace the hardcoded siteContent object with all content from the database
  // This is critical to ensure all template variables are properly replaced
  // Ensure contentMap is properly JSON-serializable and handle potential circular references
  const safeContentMap = {};
  Object.keys(contentMap).forEach(key => {
    // Only include string, number, boolean values to avoid serialization issues
    const value = contentMap[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safeContentMap[key] = value;
    } else if (value === null || value === undefined) {
      safeContentMap[key] = "";
    } else {
      // For complex objects, convert to string to avoid circular reference errors
      try {
        safeContentMap[key] = JSON.stringify(value);
      } catch (e) {
        safeContentMap[key] = String(value);
      }
    }
  });
  
  const siteContentReplacement = `window.siteContent = ${JSON.stringify(safeContentMap, null, 2)};`;
  
  // Use a more robust pattern to match the siteContent object
  const siteContentPattern = /window\.siteContent\s*=\s*\{[\s\S]*?\};/;
  if (siteContentPattern.test(processedHtml)) {
    console.log('Found siteContent object in HTML - replacing with all database content');
    try {
      processedHtml = processedHtml.replace(siteContentPattern, siteContentReplacement);
      console.log('Successfully replaced siteContent object with database content');
    } catch (error) {
      console.error('Error replacing siteContent:', error);
    }
    
    // Also ensure any hardcoded references to Annie Sicard are removed
    console.log('Checking for hardcoded references to Annie Sicard...');
    processedHtml = processedHtml.replace(/anniesicard\.com/g, contentMap.client_website || '');
    processedHtml = processedHtml.replace(/Annie Sicard/g, contentMap.client_name || '');
  } else {
    console.log('WARNING: Could not find siteContent object in HTML template');
  }
  
  // Process each key in the contentMap directly to ensure consistent handling
  console.log('Using direct key-by-key replacement approach for maximum consistency');
  
  // First pass: Replace all handlebars templates in HTML content (not in JS strings)
  Object.keys(contentMap).forEach(key => {
    if (contentMap[key]) {
      // Ensure we're only dealing with string values
      const value = String(contentMap[key]);
      const pattern = new RegExp('{{' + key + '}}', 'g');
      
      console.log(`Replacing template {{${key}}} with value: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      processedHtml = processedHtml.replace(pattern, value);
    }
  });
  
  // Process banner images specially to apply them as background images with style attributes
  for (let i = 1; i <= 3; i++) {
    const bannerKey = `banner_image_${i}_url`;
    if (contentMap[bannerKey] && contentMap[bannerKey].trim() !== '') {
      const imgUrl = contentMap[bannerKey];
      console.log(`Setting banner image ${i} with URL: ${imgUrl}`);

      // Fix for banner divs that include the URL directly inside them
      const bannerDivWithUrl = new RegExp(`<div class="banner-divider banner-divider-${i}"[^>]*data-key="banner_image_${i}_url"[^>]*>(.*?)</div>`, 'g');
      processedHtml = processedHtml.replace(bannerDivWithUrl, `<div class="banner-divider banner-divider-${i}" data-key="banner_image_${i}_url" style="background-image: url('${imgUrl}');"></div>`);
      
      // Also try the simpler selector
      const bannerDivider = `<div class="banner-divider banner-divider-${i}" data-key="banner_image_${i}_url">`;
      const bannerWithImage = `<div class="banner-divider banner-divider-${i}" data-key="banner_image_${i}_url" style="background-image: url('${imgUrl}');">`;  
      processedHtml = processedHtml.split(bannerDivider).join(bannerWithImage);
      
      console.log(`Banner image ${i} replacement completed`);
    }
  }
  
  // IMPROVED: Process social media titles with more reliable replacement strategy
  const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  
  // Log available social media title keys for debugging
  const socialTitleKeys = Object.keys(contentMap).filter(key => /_title_\d+$/.test(key));
  console.log('Available social media title keys:', socialTitleKeys);
  
  socialPlatforms.forEach(platform => {
    const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
    
    for (let i = 1; i <= 4; i++) {
      const titleKey = `${platform}_title_${i}`;
      if (contentMap[titleKey] && contentMap[titleKey].trim() !== '') {
        console.log(`Setting ${platform} post ${i} title to: ${contentMap[titleKey]}`);
        
        // Replace the default platform title with our specific title
        const defaultTitle = `${capitalizedPlatform} Update`;
        
        // Try multiple approaches to find and replace the social media title
        
        // Approach 1: Use regex with capturing groups to preserve any attributes
        const titleRegex = new RegExp(`(<h4[^>]*data-key=["']${titleKey}["'][^>]*>)([^<]*)(</h4>)`, 'g');
        processedHtml = processedHtml.replace(titleRegex, `$1${contentMap[titleKey]}$3`);
        
        // Approach 2: Try specific patterns for known templates
        let searchString1 = `<h4 class="post-title" data-key="${titleKey}">${defaultTitle}</h4>`;
        let replaceString1 = `<h4 class="post-title" data-key="${titleKey}">${contentMap[titleKey]}</h4>`;
        processedHtml = processedHtml.split(searchString1).join(replaceString1);
        
        // Approach 3: Try without the class
        let searchString2 = `<h4 data-key="${titleKey}">${defaultTitle}</h4>`;
        let replaceString2 = `<h4 data-key="${titleKey}">${contentMap[titleKey]}</h4>`;
        processedHtml = processedHtml.split(searchString2).join(replaceString2);
        
        // Approach 4: Most aggressive - replace any h4 with the right data-key
        const aggTitleRegex = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>[^<]*</h4>`, 'g');
        processedHtml = processedHtml.replace(aggTitleRegex, `<h4 class="post-title" data-key="${titleKey}">${contentMap[titleKey]}</h4>`);
        
        // Log what we're doing
        console.log(`Applied multiple replacement strategies for ${titleKey}`);
      }
    }
  });

  // Second pass: Process handlebars templates that might still exist (in case of nested templates)
  let handlebarsMatch;
  let handlebarsRegex = /{{([^}]+)}}/g;
  let tempHtml = processedHtml;
  let replacements = [];
  
  while ((handlebarsMatch = handlebarsRegex.exec(tempHtml)) !== null) {
    const key = handlebarsMatch[1];
    const value = contentMap[key] || '';
    
    if (value) {
      console.log(`Second pass replacing {{${key}}} with value: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      replacements.push({
        pattern: handlebarsMatch[0],
        value: value
      });
    } else {
      console.log(`Warning: No value found for template {{${key}}}`);
    }
  }
  
  // Apply all second-pass replacements
  replacements.forEach(rep => {
    // Escape special regex characters in the search pattern
    const searchPattern = rep.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processedHtml = processedHtml.replace(new RegExp(searchPattern, 'g'), rep.value);
  });

  // Handle social media titles and posts with enhanced debugging - using the existing socialPlatforms array
  
  console.log('DEBUG: Beginning social media title replacements');
  console.log('DEBUG: Available content keys:', Object.keys(contentMap).filter(key => key.includes('_title_')));
  
  // Better approach: Directly operate on the DOM structure
  socialPlatforms.forEach(platform => {
    for (let i = 1; i <= 4; i++) {
      const titleKey = `${platform}_title_${i}`;
      
      if (contentMap[titleKey] && contentMap[titleKey].trim() !== '') {
        console.log(`DEBUG: Found content for ${titleKey}: "${contentMap[titleKey]}". Looking for elements to replace...`);
        
        // More comprehensive approach: Use multiple methods to try to replace titles
        const titleValue = contentMap[titleKey];
        const defaultTitle = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Update`;
        
        // Method 1: Direct string replacement
        const exactTitlePattern = `<h4 class="post-title" data-key="${titleKey}">${defaultTitle}</h4>`;
        const exactReplacement = `<h4 class="post-title" data-key="${titleKey}">${titleValue}</h4>`;
        
        // Method 2: Use regular expression with flexible matching
        const regexPattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>[^<]*<\/h4>`, 'g');
        
        // Method 3: More aggressive pattern matching - find any h4 that has our data-key
        const flexiblePattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>.*?<\/h4>`, 'g');
        
        // Apply all replacement methods
        let replacementCount = 0;
        
        // 1. Direct replacement
        const before1 = processedHtml;
        processedHtml = processedHtml.split(exactTitlePattern).join(exactReplacement);
        if (before1 !== processedHtml) {
          replacementCount++;
          console.log(`DEBUG: Method 1 successfully replaced title for ${titleKey}`);
        }
        
        // 2. Regex replacement
        const before2 = processedHtml;
        processedHtml = processedHtml.replace(regexPattern, exactReplacement);
        if (before2 !== processedHtml) {
          replacementCount++;
          console.log(`DEBUG: Method 2 successfully replaced title for ${titleKey}`);
        }
        
        // 3. Flexible replacement
        const before3 = processedHtml;
        processedHtml = processedHtml.replace(flexiblePattern, exactReplacement);
        if (before3 !== processedHtml) {
          replacementCount++;
          console.log(`DEBUG: Method 3 successfully replaced title for ${titleKey}`);
        }
        
        // Report if no replacements occurred
        if (replacementCount === 0) {
          console.log(`WARNING: Could not find title element for ${titleKey} to replace!`);
          
          // Check if the title exists in any form
          if (processedHtml.includes(`data-key="${titleKey}"`)) {
            console.log(`DEBUG: Found data-key="${titleKey}" but couldn't replace the content`);
          }
        }
      }
      
      // Handle post content
      const contentKey = `${platform}_post_${i}`;
      if (contentMap[contentKey] && contentMap[contentKey].trim() !== '') {
        console.log(`Replacing ${platform} post ${i} content with: ${contentMap[contentKey].substring(0, 30)}...`);
        
        // Replace content in post cards - using data-key attribute
        const contentPattern = new RegExp(`<p[^>]*data-key="${contentKey}"[^>]*>[\s\S]*?<\/p>`, 'g');
        processedHtml = processedHtml.replace(
          contentPattern,
          `<p class="excerpt social-excerpt" data-key="${contentKey}">${contentMap[contentKey]}</p>`
        );
      }
    }
  });

  // Log the keys we're looking for in the template
  console.log('Content keys available:', Object.keys(contentMap));

  // Handle specific content types that need special processing
  // Profile image - try multiple possible field names
  const profileImageUrl = contentMap.profile_image_url || contentMap.profile_image || contentMap.avatar_url || '';
  if (profileImageUrl) {
    console.log('Found profile image URL:', profileImageUrl);

    // Replace profile image in the header section
    processedHtml = processedHtml.replace(
      /<div class="profile-image-container">([\s\S]*?)<\/div>/g,
      `<div class="profile-image-container"><img class="profile-image" src="${profileImageUrl}" alt="Profile"></div>`
    );
    
    // Replace any img with class="profile-image"
    processedHtml = processedHtml.replace(
      /<img[^>]*class="profile-image"[^>]*>/g,
      `<img class="profile-image" src="${profileImageUrl}" alt="Profile">`
    );
    
    // Handle Handlebars-style template variables like {{profile_image_url}}
    processedHtml = processedHtml.replace(
      /{{profile_image_url}}/g,
      profileImageUrl
    );
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
      `rendered_blog_${i}_content`,
      `rendered_blog_post_${i}`,
      `blog_${i}` // Add the simple blog_1, blog_2 format used in the database
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
      
      // Replace blog title in the blog card
      processedHtml = processedHtml.replace(
        new RegExp(`<h3 class="blog-title">Blog Post ${i}<\/h3>`, 'g'),
        `<h3 class="blog-title">${contentMap[titleKey]}</h3>`
      );
      
      // Replace blog title in the blog card
      processedHtml = processedHtml.replace(
        new RegExp(`<h3 class="blog-title">Blog Post ${i}<\/h3>`, 'g'),
        `<h3 class="blog-title">${contentMap[titleKey]}</h3>`
      );
      
      // Format 1: data-blog attribute
      processedHtml = processedHtml.replace(
        new RegExp(`<h3[^>]*data-blog="${i}"[^>]*>[\s\S]*?<\/h3>`, 'g'),
        `<h3 data-blog="${i}">${contentMap[titleKey]}</h3>`
      );
      
      // Format 2: data-key attribute
      processedHtml = processedHtml.replace(
        new RegExp(`<h3[^>]*data-key="blog_${i}_title"[^>]*>[\s\S]*?<\/h3>`, 'g'),
        `<h3 data-key="blog_${i}_title">${contentMap[titleKey]}</h3>`
      );
    }
    
    // Handle blog content
    if (contentKey && contentMap[contentKey]) {
      console.log(`Found blog ${i} content (${contentKey}, length: ${contentMap[contentKey].length})`);
      
      // Replace blog excerpt in the blog card
      processedHtml = processedHtml.replace(
        new RegExp(`<p class="excerpt blog-excerpt" data-key="rendered_blog_post_${i}">([\s\S]*?)<\/p>`, 'g'),
        `<p class="excerpt blog-excerpt" data-key="rendered_blog_post_${i}">${contentMap[contentKey]}</p>`
      );
      
      // Format 1: data-blog-content attribute
      const contentRegex1 = new RegExp(`<p[^>]*data-blog-content="${i}"[^>]*>([\s\S]*?)<\/p>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex1,
        `<p data-blog-content="${i}">${contentMap[contentKey]}</p>`
      );
      
      // Format 2: data-key attribute
      const contentRegex2 = new RegExp(`<p[^>]*data-key="blog_${i}_content"[^>]*>[\s\S]*?<\/p>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex2,
        `<p data-key="blog_${i}_content">${contentMap[contentKey]}</p>`
      );
      
      // Format 3: div with data-key attribute (for longer content)
      const contentRegex3 = new RegExp(`<div[^>]*data-key="blog_${i}_content"[^>]*>[\s\S]*?<\/div>`, 'g');
      processedHtml = processedHtml.replace(
        contentRegex3,
        `<div data-key="blog_${i}_content">${contentMap[contentKey]}</div>`
      );
    }
  }
  
  // Handle color selections
  const colorKeys = ['primary_color', 'accent_color', 'background_color', 'text_color'];
  let customCss = '';
  
  colorKeys.forEach(key => {
    if (contentMap[key]) {
      console.log(`Found color setting for ${key}: ${contentMap[key]}`);
      
      // Add to custom CSS
      switch(key) {
        case 'primary_color':
          customCss += `
            :root { --primary-color: ${contentMap[key]}; }
            .header, .footer, .action-button, .section-divider .divider-fill { background-color: ${contentMap[key]}; }
          `;
          break;
        case 'accent_color':
          customCss += `
            :root { --accent-color: ${contentMap[key]}; }
            .quote-card, .social-card h3, h2, .nav-links a:hover { color: ${contentMap[key]}; }
          `;
          break;
        case 'background_color':
          customCss += `
            :root { --background-color: ${contentMap[key]}; }
            body { background-color: ${contentMap[key]}; }
          `;
          break;
        case 'text_color':
          customCss += `
            :root { --text-color: ${contentMap[key]}; }
            body, p, h1, h3, h4, h5, h6 { color: ${contentMap[key]}; }
          `;
          break;
      }
    }
  });
  
  // Add custom CSS to the style tag
  if (customCss) {
    processedHtml = processedHtml.replace(
      /<style id="dynamic-theme"><\/style>/,
      `<style id="dynamic-theme">${customCss}</style>`
    );
  }
  
  // Find all data-key attributes and replace them
  const dataKeyRegex = /data-key="([^"]+)"/g;
  let match;
  let htmlCopy = html; // Use a copy to find all matches without modifying the original
  
  while ((match = dataKeyRegex.exec(htmlCopy)) !== null) {
    const key = match[1];
    const value = contentMap[key] || '';
    
    // Skip if we've already handled this key in the specialized sections above
    // Don't skip blog content or profile image keys to ensure they get applied
    if (colorKeys.includes(key)) {
      continue;
    }
    
    console.log(`Replacing data-key="${key}" with value: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
    
    // Replace the content of the element with the value - using a more robust pattern
    // that can handle multiline content between tags
    const elementRegex = new RegExp(`<([^>]+)data-key="${key}"[^>]*>([\s\S]*?)</`, 'g');
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
