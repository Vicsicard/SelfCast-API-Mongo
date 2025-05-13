// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// Initialize site content storage
window.siteContent = {};

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
            --primary-color: ${styles.primary_color};
            --secondary-color: ${styles.secondary_color};
            --accent-color: ${styles.accent_color};
            --text-color: ${styles.text_color};
            --background-color: ${styles.background_color};
            --heading-font: '${styles.heading_font}', sans-serif;
            --body-font: '${styles.body_font}', sans-serif;
        }
    `;

    style.textContent = css;
}

// Get project ID from URL or use default
function getProjectId() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    console.log('Using default project ID: annie-sicard-123');
    return projectId || 'annie-sicard-123';
}

// Load and inject content
async function loadContent() {
    try {
        const projectId = getProjectId();
        console.log('Loading content for project:', projectId);

        // Fetch all content from Supabase
        const { data: contentData, error: contentError } = await supabase
            .from('dynamic_content')
            .select('*')
            .eq('project_id', projectId);

        if (contentError) throw contentError;
        console.log('Content data:', contentData);

        // Convert array to object for theme styles
        const themeData = {};
        contentData.forEach(item => {
            themeData[item.key] = item.value;
        });

        // Load fonts and inject styles
        loadFonts(themeData.heading_font || 'Roboto', themeData.body_font || 'Open Sans');
        injectStyles(themeData);

        // Process each content item and store for modal use
        contentData.forEach(item => {
            // Store content for modal use
            window.siteContent[item.key] = item.value;
            
            // Debug: Log all keys and values
            console.log(`Processing key: ${item.key}, value: ${item.value}`);
            
            // Special handling for profile image
            if (item.key === 'profile_image_url') {
                const profileImg = document.querySelector('img[data-key="profile_image_url"]');
                if (profileImg) {
                    // Only update if the image is a placeholder or matches the old URL
                    if (profileImg.src.includes('placeholder') || 
                        profileImg.src.includes('image06.jpg')) {
                        console.log('Setting profile image src to:', item.value);
                        profileImg.src = item.value;
                    } else {
                        console.log('Keeping existing profile image:', profileImg.src);
                    }
                } else {
                    console.error('Profile image element not found');
                }
            }
            
            // Find elements with matching data-key
            const elements = document.querySelectorAll(`[data-key="${item.key}"]`);
            console.log(`Found ${elements.length} elements with data-key="${item.key}"`);
            
            elements.forEach(element => {
                if (item.key === 'rendered_bio_html') {
                    // Store original bio content
                    element.innerHTML = item.value;
                    
                    // Create fun fact cards from bio content
                    createBioCards(item.value, element);
                } else if (item.key.includes('_url')) {
                    // Handle URLs differently based on element type
                    if (element.tagName === 'IMG') {
                        // For image elements, set the src attribute
                        console.log(`Setting image src for ${item.key}:`, element, item.value);
                        element.src = item.value;
                    } else {
                        // For link elements, set the href attribute
                        element.href = item.value;
                    }
                } else if (item.key.startsWith('rendered_blog_post_') || item.key.includes('_post')) {
                    // Create excerpt for blog and social posts
                    console.log('Creating excerpt for:', item.key);
                    console.log('Full content:', item.value);
                    
                    // Try to find first paragraph or description
                    let excerpt;
                    if (item.value.includes('Description:')) {
                        // For blog posts that have a description section
                        const description = item.value.split('Description:')[1].split('\n\n')[0].trim();
                        excerpt = description.length > 300 ? description.substring(0, 300) + '...' : description;
                    } else {
                        // For social posts or other content
                        const text = item.value.split('\n')[0];
                        excerpt = text.length > 300 ? text.substring(0, 300) + '...' : text;
                    }
                    console.log('Created excerpt:', excerpt);
                    element.textContent = excerpt;
                } else {
                    // For other content (titles, text, etc.)
                    element.textContent = item.value;
                }
            });
        });

    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Create fun fact cards from bio content
function createBioCards(bioContent, element) {
    // Use static words for the cards
    const words = ['Mind', 'Body', 'Soul'];
    
    // Create a container for the cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'bio-cards';
    
    // Create a card for each word
    words.forEach(word => {
        const card = document.createElement('div');
        card.className = 'bio-card';
        
        // Gradient styled word
        const wordElem = document.createElement('span');
        wordElem.className = 'bio-card-title';
        wordElem.textContent = word;
        card.appendChild(wordElem);
        
        cardsContainer.appendChild(card);
    });
    
    // Insert the cards after the bio content
    element.parentNode.insertBefore(cardsContainer, element.nextSibling);
}

// Modal functions
function openModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    // Get content based on type
    let title, content;
    if (type.startsWith('blog-')) {
        // For blog posts
        const blogNum = type.replace('blog-', '');
        const blogKey = `rendered_blog_post_${blogNum}`;
        content = window.siteContent[blogKey];
        
        // Split content into sections
        const sections = content.split('\n\n');
        title = sections[0].replace(/["]/g, ''); // First line is the title
        
        // Format content with proper spacing
        const formattedContent = sections.slice(1).map(section => {
            if (section.startsWith('Description:')) {
                return `<p class="description">${section.replace('Description:', '<strong>Description:</strong>')}</p>`;
            }
            return `<p>${section}</p>`;
        }).join('');
        
        modalContent.innerHTML = formattedContent;
    } else {
        // For social media posts
        const postKey = `${type}_post`;
        content = window.siteContent[postKey];
        title = type.charAt(0).toUpperCase() + type.slice(1) + ' Update';
        
        // Format social media content with line breaks
        modalContent.innerHTML = content.split('\n').map(line => 
            line.trim() ? `<p>${line}</p>` : ''
        ).join('');
    }

    // Set modal title
    modalTitle.innerHTML = `<h2>${title}</h2>`;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}

// Close modal on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Initialize content on page load
document.addEventListener('DOMContentLoaded', function() {
    loadContent();
});

// Parallax effect for hero section
function initParallax() {
    window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        const heroSection = document.querySelector('.hero');
        const layerBack = document.querySelector('.layer-back');
        const layerMid = document.querySelector('.layer-mid');
        
        // Only apply parallax if hero is in view
        if (heroSection) {
            const heroRect = heroSection.getBoundingClientRect();
            if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
                const scrollSpeed = 0.5; // Adjust for more/less effect
                if (layerBack) layerBack.style.transform = `translateY(${scrollPosition * scrollSpeed * 0.5}px) translateZ(-10px) scale(2)`;
                if (layerMid) layerMid.style.transform = `translateY(${scrollPosition * scrollSpeed * 0.3}px) translateZ(-5px) scale(1.5)`;
            }
        }
    });
}

// Initialize parallax effect
document.addEventListener('DOMContentLoaded', function() {
    initParallax();
});
