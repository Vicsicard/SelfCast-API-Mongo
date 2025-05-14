/**
 * Improved social media title replacement function
 * This is a standalone function that can be used to debug and test the title replacement logic
 */
function fixSocialMediaTitles(html, contentMap) {
  console.log('Starting improved social media title replacement');
  let processedHtml = html;
  
  // Get all social media title keys
  const titleKeys = Object.keys(contentMap).filter(key => /_title_\d+$/.test(key));
  console.log('Found social media title keys:', titleKeys);
  
  // Process each social media platform
  const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  
  socialPlatforms.forEach(platform => {
    const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
    
    for (let i = 1; i <= 4; i++) {
      const titleKey = `${platform}_title_${i}`;
      
      // Only process if we have a value for this title
      if (contentMap[titleKey] && contentMap[titleKey].trim() !== '') {
        const titleValue = contentMap[titleKey];
        console.log(`FIXING: Replacing ${platform} post ${i} title with: "${titleValue}"`);
        
        // Default title as shown in the template
        const defaultTitle = `${capitalizedPlatform} Update`;
        
        // SIMPLIFIED APPROACH: Focus on the exact pattern from the template
        // This is the format we saw in social-section-template.html
        const exactPattern = `<h4 class="post-title" data-key="${titleKey}">${defaultTitle}</h4>`;
        const exactReplacement = `<h4 class="post-title" data-key="${titleKey}">${titleValue}</h4>`;
        
        // Direct string replacement first (most reliable)
        const beforeReplace = processedHtml;
        processedHtml = processedHtml.split(exactPattern).join(exactReplacement);
        
        // If direct replacement didn't work, try a more flexible regex approach
        if (beforeReplace === processedHtml) {
          console.log(`Direct replacement failed for ${titleKey}, trying regex...`);
          // This regex matches any h4 tag with the specific data-key attribute
          const flexPattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>[^<]*</h4>`, 'g');
          processedHtml = processedHtml.replace(flexPattern, exactReplacement);
        }
        
        // Check if any replacement worked
        if (beforeReplace === processedHtml) {
          console.log(`WARNING: Failed to replace title for ${titleKey}`);
          // Add a more aggressive last-resort approach
          // This regex looks for any h4 with the data-key, even if it has content in between
          const lastResortPattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>.*?</h4>`, 'g');
          processedHtml = processedHtml.replace(lastResortPattern, exactReplacement);
        } else {
          console.log(`SUCCESS: Title replaced for ${titleKey}`);
        }
      }
    }
  });
  
  return processedHtml;
}

module.exports = fixSocialMediaTitles;
