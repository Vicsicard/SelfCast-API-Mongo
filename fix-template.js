/**
 * Fix Template Script
 * 
 * This script updates the standard template to remove hardcoded Annie Sicard content
 * and replace it with generic template variables.
 */

const fs = require('fs');
const path = require('path');

// Path to the template file
const templatePath = path.join(__dirname, 'templates', 'standard', 'index.html');

// Read the current template
try {
  console.log(`Reading template file: ${templatePath}`);
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Create a backup of the original template
  const backupPath = path.join(__dirname, 'templates', 'standard', 'index.html.bak');
  fs.writeFileSync(backupPath, templateContent);
  console.log(`Created backup of original template at: ${backupPath}`);
  
  // Replace the hardcoded siteContent object with generic template variables
  const genericSiteContent = {
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
    "rendered_footer_slogan": "{{rendered_footer_slogan}}",
    "secondary_color": "{{secondary_color}}",
    "quote_1": "{{quote_1}}",
    "quote_2": "{{quote_2}}",
    "quote_3": "{{quote_3}}",
    "profile_image_url": "{{profile_image_url}}"
  };
  
  // Convert to string format for insertion into the template
  const genericSiteContentString = `window.siteContent = ${JSON.stringify(genericSiteContent, null, 2)};`;
  
  // Replace the existing siteContent object
  const siteContentPattern = /window\.siteContent\s*=\s*\{[\s\S]*?\};/;
  
  if (siteContentPattern.test(templateContent)) {
    console.log('Found siteContent object in template - replacing with generic variables');
    templateContent = templateContent.replace(siteContentPattern, genericSiteContentString);
    
    // Also replace any direct references to Annie Sicard or anniesicard.com
    templateContent = templateContent.replace(/anniesicard\.com/g, '{{client_website}}');
    templateContent = templateContent.replace(/Annie Sicard/g, '{{client_name}}');
    
    // Write the updated template back to the file
    fs.writeFileSync(templatePath, templateContent);
    console.log('Successfully updated template with generic variables');
  } else {
    console.log('WARNING: Could not find siteContent object in template');
  }
} catch (error) {
  console.error('Error updating template:', error);
}

console.log('Template update process complete');
