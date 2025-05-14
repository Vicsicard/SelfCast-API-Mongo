// Static site script.js
// This is a modified version of the script.js file that works with static sites

// Initialize site content storage
window.siteContent = window.siteContent || {};

// Load Google Fonts safely
function loadFonts(headingFont, bodyFont) {
    try {
        // Default fonts if not provided
        headingFont = headingFont || 'Roboto';
        bodyFont = bodyFont || 'Open Sans';
        
        // Process font names to work with Google Fonts
        headingFont = headingFont.replace(/,.*$/, '').trim(); // Remove any fallback fonts
        bodyFont = bodyFont.replace(/,.*$/, '').trim(); // Remove any fallback fonts
        
        // Skip loading custom fonts if using system fonts
        if (headingFont.toLowerCase().includes('arial') || 
            headingFont.toLowerCase().includes('sans-serif') ||
            headingFont.toLowerCase().includes('system-ui')) {
            console.log('Using system fonts, skipping Google Fonts loading');
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}&family=${encodeURIComponent(bodyFont)}&display=swap`;
        document.head.appendChild(link);
        console.log(`Loaded Google Fonts: ${headingFont}, ${bodyFont}`);
    } catch (error) {
        console.error('Error loading fonts:', error);
    }
}

// Inject dynamic theme styles
function injectStyles(styles) {
    const style = document.getElementById('dynamic-theme');
    if (!style) return;

    const css = `
        :root {
            --primary-color: ${styles.primary_color || '#3498db'};
            --secondary-color: ${styles.secondary_color || '#2c3e50'};
            --accent-color: ${styles.accent_color || '#e74c3c'};
            --text-color: ${styles.text_color || '#333333'};
            --background-color: ${styles.background_color || '#ffffff'};
            --heading-font: '${styles.heading_font || 'Roboto'}', sans-serif;
            --body-font: '${styles.body_font || 'Open Sans'}', sans-serif;
        }
    `;

    style.textContent = css;
}

// Get project ID from URL path or URL parameter
function getProjectId() {
    // Try to get project ID from URL path first (e.g., /sites/project-id/)
    const pathMatch = window.location.pathname.match(/\/sites\/([\w-]+)/);
    if (pathMatch && pathMatch[1]) {
        console.log('Using project ID from URL path:', pathMatch[1]);
        return pathMatch[1];
    }
    
    // Fall back to URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    if (projectId) {
        console.log('Using project ID from URL parameter:', projectId);
        return projectId;
    }
    
    // Fall back to global variable if defined
    if (typeof PROJECT_ID !== 'undefined') {
        console.log('Using project ID from global variable:', PROJECT_ID);
        return PROJECT_ID;
    }
    
    console.log('No project ID found, using default');
    return 'default-project';
}

// Load and inject content
function loadContent() {
    try {
        console.log('Loading content for static site');
        const projectId = getProjectId();
        console.log('Loading content for project:', projectId);
        
        // Check if we need to load content from the API first
        if (!window.siteContent || Object.keys(window.siteContent).length === 0) {
            console.log('No preloaded content found, attempting to load from API');
            fetchAndLoadContent(projectId);
            return;
        }
        
        console.log('Content data:', Object.keys(window.siteContent));
        
        // Set default values for missing theme properties
        const themeData = {
            primary_color: window.siteContent.primary_color || '#3498db',
            secondary_color: window.siteContent.secondary_color || '#2c3e50',
            accent_color: window.siteContent.accent_color || '#e74c3c',
            text_color: window.siteContent.text_color || '#333333',
            background_color: window.siteContent.background_color || '#ffffff',
            heading_font: window.siteContent.heading_font || 'Roboto',
            body_font: window.siteContent.body_font || 'Open Sans'
        };
        
        // Load fonts and inject styles
        loadFonts(themeData.heading_font, themeData.body_font);
        injectStyles(themeData);
        
        // Apply all content to elements with matching data-key attributes
        applyContentToElements();
        
        console.log('Static site loaded - all content pre-embedded');
    } catch (error) {
        console.error('Error loading static content:', error);
    }
}

// Apply all content to elements with matching data-key attributes
function applyContentToElements() {
    // Get all elements with data-key attribute
    const elements = document.querySelectorAll('[data-key]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-key');
        let content = window.siteContent[key];
        
        // Handle special case for profile image
        if (key === 'profile_image_url' && content) {
            if (element.tagName === 'IMG') {
                element.src = content;
                element.alt = 'Profile';
            }
            return;
        }
        
        // Handle bio content special case
        if ((key === 'bio_html' || key === 'rendered_bio_html') && content) {
            element.innerHTML = content;
            return;
        }
        
        // Set content for other elements
        if (content) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = content;
            } else {
                element.textContent = content;
            }
        }
    });
    
    // Special handling for profile image (with class selector)
    if (window.siteContent.profile_image_url) {
        const profileImages = document.querySelectorAll('img.profile-image');
        profileImages.forEach(img => {
            img.src = window.siteContent.profile_image_url;
            img.alt = 'Profile';
        });
    }
    
    // Handle blog posts
    for (let i = 1; i <= 4; i++) {
        const titleKey = `blog_${i}_title`;
        const contentKey = `blog_${i}`;
        
        if (window.siteContent[titleKey]) {
            const titleElements = document.querySelectorAll(`[data-key="${titleKey}"]`);
            const contentElements = document.querySelectorAll(`[data-key="${contentKey}"]`);
            
            titleElements.forEach(el => {
                el.textContent = window.siteContent[titleKey];
            });
            
            contentElements.forEach(el => {
                el.textContent = window.siteContent[contentKey];
            });
        }
    }
}

// Fetch content from API if needed
async function fetchAndLoadContent(projectId) {
    try {
        // Determine if we're in development or production
        const isLocalDevelopment = 
            window.location.hostname === 'localhost' || 
            window.location.hostname.includes('127.0.0.1');
        
        // Set API URL based on environment
        const apiBaseUrl = isLocalDevelopment
            ? 'http://localhost:3001/api'
            : '/api';
        
        console.log(`Fetching content from API: ${apiBaseUrl}/projects/${projectId}/content`);
        
        const response = await fetch(`${apiBaseUrl}/projects/${projectId}/content`);
        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Content data:', data);
        
        // Convert array to object format expected by the site
        if (Array.isArray(data)) {
            window.siteContent = {};
            data.forEach(item => {
                window.siteContent[item.key] = item.value;
            });
        } else if (data.content && Array.isArray(data.content)) {
            window.siteContent = {};
            data.content.forEach(item => {
                window.siteContent[item.key] = item.value;
            });
        }
        
        // Now that we have content, apply it
        loadContent();
    } catch (error) {
        console.error('Error fetching content:', error);
    }
}

// Create fun fact cards from bio content
function createBioCards(bioContent, element) {
    if (!bioContent || !element) return;
    
    // Clear existing cards
    element.innerHTML = '';
    
    // Create cards from paragraphs
    const paragraphs = bioContent.split('</p>');
    paragraphs.forEach(paragraph => {
        if (!paragraph.trim()) return;
        
        const card = document.createElement('div');
        card.className = 'bio-card';
        card.innerHTML = paragraph + '</p>';
        element.appendChild(card);
    });
}

// Modal functions
function openModal(type) {
    const modal = document.getElementById('content-modal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalContent || !modalTitle) return;
    
    // Set modal content based on type
    let content = '';
    let title = '';
    
    switch (type) {
        case 'bio':
            title = 'About Me';
            content = window.siteContent.bio_html || window.siteContent.rendered_bio_html || '';
            break;
        case 'contact':
            title = 'Contact Information';
            content = `
                <div class="contact-info">
                    <p><strong>Email:</strong> ${window.siteContent.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${window.siteContent.phone || 'Not provided'}</p>
                    <p><strong>Location:</strong> ${window.siteContent.location || 'Not provided'}</p>
                </div>
            `;
            break;
        default:
            title = 'Information';
            content = 'No content available.';
    }
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.style.display = 'flex';
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('content-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('content-modal');
    if (!modal) return;
    
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Parallax effect for hero section
function initParallax() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const offset = scrollPosition * 0.4;
        
        heroSection.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    });
}

// Initialize parallax effect
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the site
    loadContent();
    initParallax();
    
    console.log('Static site initialized');
});
