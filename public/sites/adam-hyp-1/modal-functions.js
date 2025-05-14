/**
 * Enhanced Modal and Content Functions for SelfCast
 * Handles multiple posts per social media platform and improved modal functionality
 */

// Debug logging function to help trace issues
function logDebug(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) {
        console.log(data);
    }
    
    // Also add to debug log element if it exists
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = logMessage;
        if (data) {
            logEntry.textContent += ` ${JSON.stringify(data).substring(0, 100)}`;
        }
        debugLog.appendChild(logEntry);
        // Auto-scroll
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}

// Check if the siteContent is available
function checkSiteContent() {
    try {
        if (!window.siteContent) {
            logDebug('ERROR: window.siteContent is not defined');
            // Create a fallback content object for testing
            window.siteContent = {};
            return false;
        }
        
        logDebug('siteContent is available with keys:', Object.keys(window.siteContent));
        return true;
    } catch (error) {
        logDebug('ERROR checking siteContent:', error.message);
        return false;
    }
}

// Modal functions
function openModal(contentId) {
    try {
        logDebug(`Opening modal for contentId: ${contentId}`);
        
        // Basic element checks
        const modal = document.getElementById('modal');
        if (!modal) {
            throw new Error('Modal element not found in DOM');
        }
        
        const modalTitle = document.getElementById('modal-title');
        if (!modalTitle) {
            throw new Error('Modal title element not found in DOM');
        }
        
        const modalContent = document.getElementById('modal-content');
        if (!modalContent) {
            throw new Error('Modal content element not found in DOM');
        }
        
        // Ensure siteContent exists
        if (!checkSiteContent()) {
            throw new Error('Site content is not available');
        }
        
        // Get content based on type
        let title, content;
        
        // Handle blog posts
        if (contentId.startsWith('blog-')) {
            logDebug('Processing blog post modal');
            const blogNum = contentId.replace('blog-', '');
            const blogKey = `rendered_blog_post_${blogNum}`;
            
            logDebug(`Looking for blog content with key: ${blogKey}`);
            content = window.siteContent[blogKey];
            logDebug(`Found content: ${content ? 'Yes' : 'No'}`);
            
            // If content exists
            if (content) {
                // Split content into sections
                const sections = content.split('\n\n');
                title = sections[0].replace(/["]/g, ''); // First line is the title
                logDebug(`Blog title: ${title}`);
                
                // Format content with proper spacing
                const formattedContent = sections.slice(1).map(section => {
                    if (section.startsWith('Description:')) {
                        return `<p class="description">${section.replace('Description:', '<strong>Description:</strong>')}</p>`;
                    }
                    return `<p>${section}</p>`;
                }).join('');
                
                modalContent.innerHTML = formattedContent;
            } else {
                title = `Blog Post ${blogNum}`;
                modalContent.innerHTML = '<p>No content available for this post.</p>';
                logDebug(`No content found for blog post ${blogNum}`);
            }
        } 
        // Handle social media posts
        else if (contentId.includes('-')) {
            logDebug('Processing social media post modal');
            // Parse the platform and post number (e.g., "facebook-1")
            const [platform, postNum] = contentId.split('-');
            logDebug(`Platform: ${platform}, Post Number: ${postNum}`);
            
            // Get title and content keys
            const titleKey = `${platform}_title_${postNum}`;
            const contentKey = `${platform}_post_${postNum}`;
            
            logDebug(`Title key: ${titleKey}, Content key: ${contentKey}`);
            logDebug(`Available keys in siteContent:`, Object.keys(window.siteContent));
            
            // Check if keys exist in siteContent
            const hasTitleKey = window.siteContent.hasOwnProperty(titleKey);
            const hasContentKey = window.siteContent.hasOwnProperty(contentKey);
            logDebug(`Has title key: ${hasTitleKey}, Has content key: ${hasContentKey}`);
            
            // Set title
            title = window.siteContent[titleKey] || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Update`;
            logDebug(`Using title: ${title}`);
            
            // Get content
            content = window.siteContent[contentKey];
            logDebug(`Content found: ${content ? 'Yes' : 'No'}`);
            
            if (content) {
                logDebug('Content sample:', content.substring(0, 50));
                // Format social media content with line breaks and hashtag highlighting
                modalContent.innerHTML = content.split('\n').map(line => {
                    // Highlight hashtags
                    const lineWithHashtags = line.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
                    return line.trim() ? `<p>${lineWithHashtags}</p>` : '';
                }).join('');
                logDebug('Formatted content and set to modal');
            } else {
                modalContent.innerHTML = '<p>No content available for this post.</p>';
                logDebug(`No content found for ${platform} post ${postNum}`);
            }
        } 
        // Legacy support for old modal format
        else {
            logDebug('Processing legacy format modal');
            // For social media posts without a number (legacy format)
            const postKey = `${contentId}_post`;
            logDebug(`Looking for legacy content with key: ${postKey}`);
            content = window.siteContent[postKey];
            title = contentId.charAt(0).toUpperCase() + contentId.slice(1) + ' Update';
            logDebug(`Legacy title: ${title}`);
            
            if (content) {
                logDebug('Legacy content found');
                // Format social media content with line breaks
                modalContent.innerHTML = content.split('\n').map(line => 
                    line.trim() ? `<p>${line}</p>` : ''
                ).join('');
            } else {
                modalContent.innerHTML = '<p>No content available for this post.</p>';
                logDebug(`No legacy content found for ${contentId}`);
            }
        }
        
        // Set modal title
        modalTitle.innerHTML = `<h2>${title}</h2>`;
        logDebug('Set modal title');
        
        // Show modal with animation
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        logDebug('Modal displayed');
        
        // Focus trap for accessibility
        setTimeout(() => {
            const closeButton = document.querySelector('.close-button');
            if (closeButton) closeButton.focus();
            logDebug('Modal fully initialized');
        }, 100);
        
    } catch (error) {
        console.error('Error opening modal:', error);
        logDebug(`ERROR opening modal: ${error.message}`);
        alert(`There was an error opening the modal: ${error.message}. Check the console for details.`);
    }
}

function closeModal() {
    try {
        logDebug('Closing modal');
        const modal = document.getElementById('modal');
        if (!modal) {
            throw new Error('Modal element not found when trying to close');
        }
        
        // Add fade-out animation
        modal.classList.add('fade-out');
        logDebug('Added fade-out animation');
        
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
            document.body.style.overflow = 'auto'; // Restore scrolling
            logDebug('Modal closed completely');
        }, 300);
    } catch (error) {
        console.error('Error closing modal:', error);
        logDebug(`ERROR closing modal: ${error.message}`);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    try {
        const modal = document.getElementById('modal');
        if (event.target == modal) {
            logDebug('Modal close triggered by outside click');
            closeModal();
        }
    } catch (error) {
        console.error('Error in window click handler:', error);
        logDebug(`ERROR in window click handler: ${error.message}`);
    }
}

// Close modal on escape key
document.addEventListener('keydown', function(event) {
    try {
        if (event.key === 'Escape') {
            logDebug('Modal close triggered by Escape key');
            closeModal();
        }
    } catch (error) {
        console.error('Error in keydown handler:', error);
        logDebug(`ERROR in keydown handler: ${error.message}`);
    }
});

// Initialize logging when the script loads
logDebug('Modal functions script loaded successfully');

// Report any errors loading siteContent
document.addEventListener('DOMContentLoaded', function() {
    logDebug('DOM fully loaded, checking siteContent availability');
    checkSiteContent();
});
