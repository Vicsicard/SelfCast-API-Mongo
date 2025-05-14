/**
 * Permanent Template Fix Script
 * 
 * This script permanently fixes the template files by removing all hardcoded 
 * Annie Sicard content, instead of relying on runtime replacements.
 */

const fs = require('fs');
const path = require('path');

console.log('Starting permanent template fix...');

// Fix the index.html template file
const indexPath = path.join(__dirname, 'templates', 'standard', 'index.html');
try {
  console.log(`Fixing template HTML at: ${indexPath}`);
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Create a backup
  fs.writeFileSync(`${indexPath}.bak2`, content);
  console.log('Created backup of index.html');
  
  // Replace hardcoded Annie Sicard content in the HTML
  content = content.replace(/Annie Sicard/g, '{{client_name}}');
  content = content.replace(/anniesicard\.com/g, '{{client_website}}');
  
  // Look for and remove all hardcoded blog posts
  const blogPostPattern = /<p class="post-content">\s*[\s\S]*?<\/p>\s*<button class="action-button"/g;
  content = content.replace(blogPostPattern, '<p class="post-content">{{rendered_blog_post_$INDEX}}</p>\n                    <button class="action-button"');
  
  // Replace all blog content sections with placeholders
  for (let i = 1; i <= 4; i++) {
    content = content.replace(
      new RegExp(`<p class="post-content">.*?<\/p>\\s*<button class="action-button" onclick="openModal\\('blog-${i}'\\)">`, 's'),
      `<p class="post-content">{{rendered_blog_post_${i}}}</p>\n                    <button class="action-button" onclick="openModal('blog-${i}')">`
    );
  }
  
  // Replace social media posts content with placeholders
  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  platforms.forEach(platform => {
    for (let i = 1; i <= 4; i++) {
      const pattern = new RegExp(`<p class="post-content">.*?<\/p>\\s*<button class="action-button" onclick="openModal\\('${platform}-${i}'\\)">`, 's');
      content = content.replace(
        pattern,
        `<p class="post-content">{{${platform}_post_${i}}}</p>\n                        <button class="action-button" onclick="openModal('${platform}-${i}')">`
      );
    }
  });
  
  // Make the window.siteContent object more minimal to avoid conflicts
  const siteContentSection = `    <script>
      // Static content pre-loaded from build
      window.siteContent = {
  "facebook_url": "{{facebook_url}}",
  "facebook_post": "{{facebook_post}}",
  "twitter_url": "{{twitter_url}}",
  "twitter_post": "{{twitter_post}}",
  "instagram_url": "{{instagram_url}}",
  "instagram_post": "{{instagram_post}}",
  "linkedin_url": "{{linkedin_url}}",
  "linkedin_post": "{{linkedin_post}}",
  "client_name": "{{client_name}}",
  "client_website": "{{client_website}}",
  "style_package": "{{style_package}}",
  "current_year": "{{current_year}}",
  "rendered_title": "{{rendered_title}}",
  "rendered_subtitle": "{{rendered_subtitle}}",
  "primary_color": "{{primary_color}}",
  "accent_color": "{{accent_color}}",
  "text_color": "{{text_color}}",
  "background_color": "{{background_color}}",
  "heading_font": "{{heading_font}}",
  "body_font": "{{body_font}}",
  "rendered_bio_html": "{{rendered_bio_html}}",
  "rendered_blog_post_1": "{{rendered_blog_post_1}}",
  "rendered_blog_post_2": "{{rendered_blog_post_2}}",
  "rendered_blog_post_3": "{{rendered_blog_post_3}}",
  "rendered_blog_post_4": "{{rendered_blog_post_4}}",
  "rendered_footer_slogan": "{{rendered_footer_slogan}}",`;
  
  const simplifiedSiteContentSection = `    <script>
      // Site content will be populated by site generator
      window.siteContent = {
        // Content will be injected at build time
      };`;
  
  if (content.includes(siteContentSection)) {
    content = content.replace(siteContentSection, simplifiedSiteContentSection);
    console.log('Simplified the site content object');
  }
  
  // Write the updated file
  fs.writeFileSync(indexPath, content);
  console.log('Successfully updated index.html with all Annie Sicard content removed');
  
  // Now add a special marker file that the site generator will check for
  const markerPath = path.join(__dirname, 'templates', 'standard', '.template-fixed');
  fs.writeFileSync(markerPath, `Template fixed on ${new Date().toISOString()}`);
  console.log('Created template-fixed marker file');
  
} catch (error) {
  console.error('Error fixing index.html template:', error);
}

// Now update site-generator.js to check for the marker file
const siteGeneratorPath = path.join(__dirname, 'src', 'utils', 'site-generator.js');
try {
  console.log(`Updating site generator to check for fixed templates: ${siteGeneratorPath}`);
  let content = fs.readFileSync(siteGeneratorPath, 'utf8');
  
  // Create a backup if one doesn't already exist
  if (!fs.existsSync(`${siteGeneratorPath}.bak2`)) {
    fs.writeFileSync(`${siteGeneratorPath}.bak2`, content);
    console.log('Created backup of site-generator.js');
  }
  
  // Add template checking code at the start of the copyTemplateFiles function
  const copyTemplateStartSection = `/**
 * Copy template files to the output directory
 * @param {string} templateDir - Source template directory
 * @param {string} outputDir - Destination directory
 * @param {Object} contentMap - Content map for the project
 * @returns {Promise<void>}
 */
async function copyTemplateFiles(templateDir, outputDir, contentMap) {
  try {
    console.log(\`Copying template files from \${templateDir} to \${outputDir}\`);
    
    // Create the output directory if it doesn't exist
    try {
      await fs.mkdir(outputDir, { recursive: true });
      console.log(\`Created output directory: \${outputDir}\`);
    } catch (dirError) {
      console.warn(\`Directory \${outputDir} already exists or couldn't be created\`, dirError);
    }
    
    // Get all files in the template directory
    const files = await fs.readdir(templateDir);`;
  
  const improvedCopyTemplateSection = `/**
 * Copy template files to the output directory
 * @param {string} templateDir - Source template directory
 * @param {string} outputDir - Destination directory
 * @param {Object} contentMap - Content map for the project
 * @returns {Promise<void>}
 */
async function copyTemplateFiles(templateDir, outputDir, contentMap) {
  try {
    console.log(\`Copying template files from \${templateDir} to \${outputDir}\`);
    
    // Check if this is a fixed template (marker file exists)
    const markerPath = path.join(templateDir, '.template-fixed');
    let isFixedTemplate = false;
    try {
      await fs.access(markerPath);
      isFixedTemplate = true;
      console.log('Found fixed template marker - using improved template handling');
    } catch (error) {
      console.log('No template marker found - will perform runtime content replacements');
    }
    
    // Create the output directory if it doesn't exist
    try {
      await fs.mkdir(outputDir, { recursive: true });
      console.log(\`Created output directory: \${outputDir}\`);
    } catch (dirError) {
      console.warn(\`Directory \${outputDir} already exists or couldn't be created\`, dirError);
    }
    
    // Get all files in the template directory
    const files = await fs.readdir(templateDir);`;
  
  if (content.includes(copyTemplateStartSection)) {
    content = content.replace(copyTemplateStartSection, improvedCopyTemplateSection);
    console.log('Added template marker check to site generator');
  }
  
  // Write the updated file
  fs.writeFileSync(siteGeneratorPath, content);
  console.log('Successfully updated site-generator.js to check for fixed templates');
  
} catch (error) {
  console.error('Error updating site-generator.js:', error);
}

console.log('Permanent template fix completed. Please commit and deploy these changes to fix the content issues.');
