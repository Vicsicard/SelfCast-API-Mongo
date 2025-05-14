/**
 * Social Media Title Fix
 * This script ensures social media titles are properly displayed from the siteContent object
 */

// Immediately invoke function to fix social media titles
(function() {
  console.log('[SOCIAL TITLE FIX] Initializing social media title fix');
  
  // Wait for DOM content to be loaded and siteContent to be available
  document.addEventListener('DOMContentLoaded', function() {
    // Give a slight delay to ensure other scripts have run
    setTimeout(function() {
      console.log('[SOCIAL TITLE FIX] Running social media title fix');
      
      // Make sure siteContent is available
      if (typeof window.siteContent === 'undefined') {
        console.error('[SOCIAL TITLE FIX] Error: siteContent not found');
        return;
      }
      
      // List of social media platforms
      const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
      
      // For each platform, update titles for posts 1-4
      platforms.forEach(function(platform) {
        for (let i = 1; i <= 4; i++) {
          const titleKey = `${platform}_title_${i}`;
          
          // Check if the title exists in siteContent
          if (window.siteContent[titleKey]) {
            const titleValue = window.siteContent[titleKey];
            console.log(`[SOCIAL TITLE FIX] Found title for ${titleKey}: ${titleValue}`);
            
            // Find and update the corresponding HTML element
            const titleElements = document.querySelectorAll(`h4[data-key="${titleKey}"]`);
            if (titleElements.length > 0) {
              titleElements.forEach(function(element) {
                console.log(`[SOCIAL TITLE FIX] Updating element for ${titleKey}`);
                element.textContent = titleValue;
              });
            } else {
              console.warn(`[SOCIAL TITLE FIX] Could not find HTML element for ${titleKey}`);
            }
          }
        }
      });
      
      console.log('[SOCIAL TITLE FIX] Social media title fix complete');
    }, 100); // Small delay to ensure other scripts have run
  });
})();
