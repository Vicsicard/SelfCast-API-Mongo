/**
 * Supabase to MongoDB API Adapter
 * 
 * This adapter intercepts Supabase API calls and redirects them to our MongoDB API.
 * It maintains the same interface expected by the Content-Editor-5-4-25.html file.
 */

(function() {
  // Get API URL from config.js
  const API_BASE_URL = window.SUPABASE_CONFIG?.mongodb?.apiUrl || 'http://localhost:3000/api';
  console.log(`Supabase Adapter using API URL: ${API_BASE_URL}`);
  
  // Original fetch function
  const originalFetch = window.fetch;
  
  // Track adapter status
  window.SupabaseAdapter = {
    enabled: true,
    redirectCount: 0,
    originalCount: 0,
    lastRedirect: null,
    toggle: function() {
      this.enabled = !this.enabled;
      console.log(`Supabase Adapter ${this.enabled ? 'enabled' : 'disabled'}`);
      return this.enabled;
    },
    stats: function() {
      return {
        enabled: this.enabled,
        redirected: this.redirectCount,
        original: this.originalCount,
        lastRedirect: this.lastRedirect
      };
    }
  };
  
  /**
   * Intercept fetch calls to Supabase and redirect to our API
   */
  window.fetch = function(url, options) {
    // If adapter is disabled, use original fetch
    if (!window.SupabaseAdapter.enabled) {
      window.SupabaseAdapter.originalCount++;
      return originalFetch(url, options);
    }
    
    // Check if this is a Supabase API call
    if (typeof url === 'string' && url.includes('supabase.co')) {
      window.SupabaseAdapter.redirectCount++;
      
      // Extract what type of call this is
      const isSelect = url.includes('select=') || (options && options.method === 'GET');
      const isInsert = options && options.method === 'POST';
      const isPatch = options && options.method === 'PATCH';
      
      // Extract project_id from the URL if present
      let projectId = null;
      const projectIdMatch = url.match(/project_id=eq\.([^&]+)/);
      if (projectIdMatch) {
        projectId = decodeURIComponent(projectIdMatch[1]);
      }
      
      // For debugging
      console.log('🔄 Intercepted Supabase call:', { 
        url, 
        method: options?.method, 
        projectId,
        body: options?.body ? JSON.parse(options.body) : null
      });
      
      window.SupabaseAdapter.lastRedirect = {
        timestamp: new Date(),
        url,
        projectId,
        method: options?.method
      };
      
      // Redirect to our API
      if (isSelect && projectId) {
        // GET content for a specific project
        console.log('📥 Redirecting to MongoDB API - GET content');
        return originalFetch(`${API_BASE_URL}/projects/${projectId}/content`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          return response.json();
        }).then(data => {
          console.log(`✅ Received ${data.length} content items from MongoDB API`);
          return new Response(JSON.stringify({ data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }).catch(error => {
          console.error('❌ API Error:', error);
          return new Response(JSON.stringify({ 
            data: [], 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      } else if ((isInsert || isPatch) && projectId && options && options.body) {
        // POST/PATCH content updates
        console.log('📤 Redirecting to MongoDB API - POST content');
        
        // Parse the original body
        let bodyData;
        try {
          bodyData = JSON.parse(options.body);
        } catch (error) {
          console.error('Error parsing body:', error);
          return Promise.reject(new Error('Invalid body format'));
        }
        
        // Handle both array and single object formats
        const contentItems = Array.isArray(bodyData) 
          ? bodyData 
          : [{ key: bodyData.key, value: bodyData.value }];
        
        // Make the request to our API
        return originalFetch(`${API_BASE_URL}/projects/${projectId}/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contentItems)
        }).then(response => {
          if (!response.ok) {
            throw new Error('API request failed');
          }
          return response.json();
        }).then(data => {
          console.log('✅ Content saved successfully to MongoDB API');
          // Transform the response to match Supabase format
          return new Response(JSON.stringify({ 
            data: contentItems.map(item => ({
              project_id: projectId,
              key: item.key,
              value: item.value
            }))
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }).catch(error => {
          console.error('❌ API Error:', error);
          return new Response(JSON.stringify({ 
            data: null, 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      } else if (url.includes('from=dynamic_content') && !projectId) {
        // GET all projects
        console.log('📋 Redirecting to MongoDB API - GET all projects');
        return originalFetch(`${API_BASE_URL}/projects`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response => {
          if (!response.ok) {
            throw new Error('API request failed');
          }
          return response.json();
        }).then(data => {
          console.log(`✅ Received ${data.projects.length} projects from MongoDB API`);
          // Transform the response to match Supabase format
          return new Response(JSON.stringify({ 
            data: data.projects.map(p => ({ project_id: p.projectId }))
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }).catch(error => {
          console.error('❌ API Error:', error);
          return new Response(JSON.stringify({ 
            data: [], 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }
    }
    
    // For all other requests, use the original fetch
    window.SupabaseAdapter.originalCount++;
    return originalFetch(url, options);
  };
  
  // Add adapter UI control (if jQuery is available)
  setTimeout(() => {
    if (window.jQuery) {
      const $ = window.jQuery;
      
      // Add adapter control to the UI
      $('body').append(`
        <div id="adapter-control" style="
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: #2c3e50;
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: sans-serif;
          z-index: 9999;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          display: flex;
          flex-direction: column;
          gap: 5px;
        ">
          <div style="font-weight: bold; margin-bottom: 5px;">
            MongoDB Adapter Control
          </div>
          <div>
            Status: <span id="adapter-status" style="color: #2ecc71;">Enabled</span>
          </div>
          <div>
            Redirected: <span id="redirect-count">0</span>
          </div>
          <div>
            Original: <span id="original-count">0</span>
          </div>
          <button id="toggle-adapter" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
          ">Toggle Adapter</button>
        </div>
      `);
      
      // Add toggle functionality
      $('#toggle-adapter').on('click', function() {
        const enabled = window.SupabaseAdapter.toggle();
        $('#adapter-status').text(enabled ? 'Enabled' : 'Disabled');
        $('#adapter-status').css('color', enabled ? '#2ecc71' : '#e74c3c');
        $(this).css('background', enabled ? '#3498db' : '#95a5a6');
      });
      
      // Update stats every second
      setInterval(() => {
        const stats = window.SupabaseAdapter.stats();
        $('#redirect-count').text(stats.redirected);
        $('#original-count').text(stats.original);
      }, 1000);
    }
  }, 1000);
  
  // Notify that the adapter is loaded
  console.log('✨ Supabase to MongoDB API Adapter loaded');
  
  // Additional compatibility with Supabase client if it exists
  if (window.supabase) {
    console.log('🔄 Enhancing Supabase client compatibility');
  }
})();
