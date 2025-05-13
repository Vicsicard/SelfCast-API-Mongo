// Static site script.js
// This is a modified version of the script.js file that works with static sites

// Initialize site content storage
window.siteContent = window.siteContent || {};

// Load Google Fonts
function loadFonts(headingFont, bodyFont) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${headingFont.replace(' ', '+')}&family=${bodyFont.replace(' ', '+')}&display=swap`;
    document.head.appendChild(link);
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

// Get project ID from URL or use default
function getProjectId() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    return projectId || PROJECT_ID || 'default-project';
}

// Load and inject content
function loadContent() {
    try {
        console.log('Loading content for static site');
        
        // For static sites, content is already embedded in the HTML
        // and window.siteContent is already populated
        
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
        
        // Process profile image if it exists
        if (window.siteContent.profile_image_url) {
            const profileImg = document.querySelector('img.profile-image');
            if (profileImg) {
                profileImg.src = window.siteContent.profile_image_url;
                profileImg.alt = 'Profile';
            }
        }
        
        // Process bio content if it exists
        if (window.siteContent.bio_html || window.siteContent.rendered_bio_html) {
            const bioContent = window.siteContent.bio_html || window.siteContent.rendered_bio_html;
            const bioElement = document.querySelector('[data-key="bio_html"]');
            if (bioElement && bioContent) {
                bioElement.innerHTML = bioContent;
            }
        }
        
        console.log('Static site content loaded successfully');
    } catch (error) {
        console.error('Error loading static content:', error);
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
