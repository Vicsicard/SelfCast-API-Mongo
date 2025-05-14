/**
 * Direct Social Media Title Replacement
 * 
 * This is a focused, specialized replacement function that specifically targets
 * social media title elements with exact pattern matching.
 * 
 * IMPORTANT: This module uses direct string replacement with exact patterns from
 * the template to ensure maximum reliability.
 */

/**
 * Replace social media titles in HTML with content from the database
 * @param {string} html - The HTML content to process
 * @param {Object} contentMap - Map of content keys to values
 * @returns {string} - Processed HTML with social media titles replaced
 */
function directSocialTitleFix(html, contentMap) {
  console.log('==========================================');
  console.log('STARTING DIRECT SOCIAL MEDIA TITLE REPLACEMENT');
  console.log('==========================================');
  
  // Define the social platforms to process
  const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
  
  // Log all available title keys in contentMap
  const titleKeys = Object.keys(contentMap).filter(key => key.includes('_title_'));
  console.log('Available title keys in content map:', titleKeys);
  
  // Start with the original HTML
  let processedHtml = html;
  
  // For each social platform
  socialPlatforms.forEach(platform => {
    // Get the capitalized platform name used in the default title
    const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
    const defaultTitle = `${capitalizedPlatform} Update`;
    
    // Process each post (1-4)
    for (let i = 1; i <= 4; i++) {
      const titleKey = `${platform}_title_${i}`;
      
      // Check if we have content for this title
      if (contentMap[titleKey] && contentMap[titleKey].trim() !== '') {
        const titleValue = contentMap[titleKey];
        console.log(`\n[${platform.toUpperCase()} POST ${i}]`);
        console.log(`Title key: ${titleKey}`);
        console.log(`Title value: "${titleValue}"`);
        
        // EXACT MATCH: Based on the template structure we observed
        // This matches PRECISELY what's in the social-section-template.html
        const exactPattern = `<h4 class="post-title" data-key="${titleKey}">${defaultTitle}</h4>`;
        const exactReplacement = `<h4 class="post-title" data-key="${titleKey}">${titleValue}</h4>`;
        
        // Verify if the exact pattern exists in the HTML
        if (processedHtml.includes(exactPattern)) {
          console.log(`✓ EXACT PATTERN FOUND in HTML for ${titleKey}`);
          
          // Make the direct replacement
          const beforeCount = processedHtml.length;
          processedHtml = processedHtml.split(exactPattern).join(exactReplacement);
          const afterCount = processedHtml.length;
          
          // Verify the replacement was made
          if (beforeCount !== afterCount) {
            console.log(`✓ REPLACEMENT SUCCESSFUL for ${titleKey}`);
            console.log(`  Changed ${beforeCount} → ${afterCount} characters`);
          } else {
            console.log(`✗ REPLACEMENT FAILED for ${titleKey}, no change in character count`);
          }
        } else {
          console.log(`✗ EXACT PATTERN NOT FOUND in HTML for ${titleKey}`);
          console.log(`  Searching for alternative patterns...`);
          
          // Try a more flexible pattern with attribute variations
          const flexiblePattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>[^<]*</h4>`, 'g');
          const flexibleMatches = processedHtml.match(flexiblePattern);
          
          if (flexibleMatches && flexibleMatches.length > 0) {
            console.log(`✓ FLEXIBLE PATTERN FOUND: ${flexibleMatches[0]}`);
            
            // Replace with the exact replacement for consistency
            const beforeCount = processedHtml.length;
            processedHtml = processedHtml.replace(flexiblePattern, exactReplacement);
            const afterCount = processedHtml.length;
            
            if (beforeCount !== afterCount) {
              console.log(`✓ FLEXIBLE REPLACEMENT SUCCESSFUL for ${titleKey}`);
            } else {
              console.log(`✗ FLEXIBLE REPLACEMENT FAILED for ${titleKey}`);
            }
          } else {
            console.log(`✗ NO MATCHING ELEMENT FOUND for ${titleKey}`);
            
            // FALLBACK: Try a more aggressive pattern
            console.log(`  Attempting last resort pattern match...`);
            
            // This will find ANY h4 tag with our data-key, regardless of content
            const lastResortPattern = new RegExp(`<h4[^>]*data-key=["']${titleKey}["'][^>]*>(.*?)</h4>`, 'g');
            const lastResortMatches = processedHtml.match(lastResortPattern);
            
            if (lastResortMatches && lastResortMatches.length > 0) {
              console.log(`✓ LAST RESORT PATTERN FOUND: ${lastResortMatches[0]}`);
              processedHtml = processedHtml.replace(lastResortPattern, exactReplacement);
              console.log(`  Replacement attempted with last resort pattern`);
            } else {
              console.log(`✗ FINAL ATTEMPT FAILED: No h4 with data-key=${titleKey} found`);
              
              // Log a small portion of HTML for debugging
              const smallHtmlSample = html.substring(0, 500) + '...';
              console.log(`  HTML sample: ${smallHtmlSample}`);
            }
          }
        }
      } else {
        console.log(`Skipping ${titleKey} - No content available in contentMap`);
      }
    }
  });

  // Final report
  console.log('\n==========================================');
  console.log('SOCIAL MEDIA TITLE REPLACEMENT COMPLETE');
  console.log('==========================================');
  
  return processedHtml;
}

module.exports = directSocialTitleFix;
