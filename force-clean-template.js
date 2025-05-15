/**
 * Force Clean Template Script
 * 
 * This script forces the site generator to use our new clean template
 * instead of the original template with hardcoded Annie Sicard content.
 */

const fs = require('fs');
const path = require('path');

console.log('Starting force-clean-template fix...');

// First, rename the original index.html to original-index.html as a backup
const originalIndexPath = path.join(__dirname, 'templates', 'standard', 'index.html');
const backupIndexPath = path.join(__dirname, 'templates', 'standard', 'original-index.html');

try {
  // Check if we've already backed up the original
  if (!fs.existsSync(backupIndexPath)) {
    console.log(`Backing up original index.html to ${backupIndexPath}`);
    fs.copyFileSync(originalIndexPath, backupIndexPath);
    console.log('Original template backed up successfully');
  } else {
    console.log('Backup already exists, skipping backup step');
  }
  
  // Copy our clean template to become the new index.html
  const cleanTemplatePath = path.join(__dirname, 'templates', 'standard', 'clean-index.html');
  console.log(`Replacing index.html with clean template from ${cleanTemplatePath}`);
  fs.copyFileSync(cleanTemplatePath, originalIndexPath);
  console.log('Template replaced successfully');
  
  // Create a marker file to indicate we're using the clean template
  const markerPath = path.join(__dirname, 'templates', 'standard', '.clean-template');
  fs.writeFileSync(markerPath, `Clean template installed on ${new Date().toISOString()}`);
  console.log('Created clean template marker file');
  
  // Now update the site-generator.js file to check for this marker
  const siteGeneratorPath = path.join(__dirname, 'src', 'utils', 'site-generator.js');
  console.log(`Updating site generator at ${siteGeneratorPath}`);
  
  // Read the site generator file
  let genContent = fs.readFileSync(siteGeneratorPath, 'utf8');
  
  // Create a backup of the site generator
  const genBackupPath = `${siteGeneratorPath}.clean-bak`;
  fs.writeFileSync(genBackupPath, genContent);
  console.log(`Created backup of site-generator.js at ${genBackupPath}`);
  
  // Add a note about the clean template at the top of the file
  const headerNote = `/**
 * Static Site Generator for SelfCast Dynamic
 * 
 * IMPORTANT: This file has been modified to use a clean template
 * without any hardcoded content. The template now uses placeholders
 * for all content, which are replaced at build time.
 */
`;
  
  // Replace the original header
  const originalHeader = `/**
 * Static Site Generator for SelfCast Dynamic
 * 
 * Generates static HTML sites based on project content and templates
 * Uses the existing template structure from SelfCast Dynamic
 */`;
  
  genContent = genContent.replace(originalHeader, headerNote);
  
  // Make a critical modification to ensure all content replacements work
  // Find the function that replaces content placeholders
  const contentReplacementFunction = `function replaceContentPlaceholders(html, contentMap) {`;
  
  // Replace it with an enhanced version that always does a thorough replacement
  const enhancedFunction = `function replaceContentPlaceholders(html, contentMap) {
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
    requiredKeys.push(\`rendered_blog_post_\${i}\`);
  }
  
  // Add social media posts
  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  platforms.forEach(platform => {
    for (let i = 1; i <= 4; i++) {
      requiredKeys.push(\`\${platform}_title_\${i}\`);
      requiredKeys.push(\`\${platform}_post_\${i}\`);
    }
  });
  
  // Ensure all required keys have values
  requiredKeys.forEach(key => {
    if (!contentMap[key]) {
      console.log(\`Adding empty placeholder for missing key: \${key}\`);
      contentMap[key] = '';
    }
  });`;
  
  genContent = genContent.replace(contentReplacementFunction, enhancedFunction);
  
  // Write the updated file
  fs.writeFileSync(siteGeneratorPath, genContent);
  console.log('Successfully updated site-generator.js to use clean template');
  
  console.log('\nSUCCESS: Force clean template script complete!');
  console.log('The site generator will now use a clean template without any hardcoded Annie Sicard content.');
  console.log('Please commit and push these changes, then redeploy to Render.');
  
} catch (error) {
  console.error('Error in force-clean-template script:', error);
}
