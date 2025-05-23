/**
 * API service for the task management system
 * Handles all communication with the backend API
 */

// Create a global API object
window.API = (function() {
  // API base URL - change this if your server runs on a different port or host
  const API_BASE_URL = '/api';
  
  // Request options with default headers
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add request timeout functionality
  const timeout = 10000; // 10 seconds timeout
  
  // Helper function to handle API responses
  function handleResponse(response) {
    return response.text()
      .then(text => {
        // Try to parse as JSON, but handle empty responses
        const data = text ? JSON.parse(text) : {};
        
        if (!response.ok) {
          const error = (data && data.error) || response.statusText;
          return Promise.reject(error);
        }
        
        return data;
      });
  }
  
  // Helper function to make API requests with timeout
  function fetchWithTimeout(url, options = {}) {
    return Promise.race([
      fetch(url, { ...defaultOptions, ...options }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]).then(handleResponse);
  }

  // Helper function to build query string
  function buildQueryString(params = {}) {
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  }

  // API endpoints object to return
  return {
    // Set the API base URL - useful for testing or changing environments
    setBaseUrl: function(url) {
      if (url) {
        console.log(`API base URL changed from ${API_BASE_URL} to ${url}`);
        API_BASE_URL = url;
      }
    },
    
    // Task endpoints
    tasks: {
      getAll: function(params = {}) {
        const queryString = buildQueryString(params);
        return fetchWithTimeout(`${API_BASE_URL}/tasks${queryString}`);
      },
      // Get demo tasks
      getDemoTasks: function() {
        return fetchWithTimeout(`${API_BASE_URL}/tasks/demo`);
      },
      getById: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/tasks/${id}`);
      },
      create: function(taskData) {
        return fetchWithTimeout(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskData)
        });
      },
      update: function(id, taskData) {
        return fetchWithTimeout(`${API_BASE_URL}/tasks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(taskData)
        });
      },
      delete: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/tasks/${id}`, {
          method: 'DELETE'
        });
      },
      // Batch operations
      bulkUpdate: function(tasksData) {
        return fetchWithTimeout(`${API_BASE_URL}/tasks/bulk`, {
          method: 'PUT', 
          body: JSON.stringify(tasksData)
        });
      }
    },
    
    // Category endpoints
    categories: {
      getAll: function() {
        return fetchWithTimeout(`${API_BASE_URL}/categories`);
      },
      getById: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/categories/${id}`);
      },
      create: function(categoryData) {
        return fetchWithTimeout(`${API_BASE_URL}/categories`, {
          method: 'POST',
          body: JSON.stringify(categoryData)
        });
      },
      update: function(id, categoryData) {
        return fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryData)
        });
      },
      delete: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
          method: 'DELETE'
        });
      },
      // Add bulk update for category reordering
      bulkUpdate: function(categoriesData) {
        return fetchWithTimeout(`${API_BASE_URL}/categories/bulk`, {
          method: 'PUT', 
          body: JSON.stringify(categoriesData)
        });
      }
    },
    
    // Status endpoints
    statuses: {
      getAll: function() {
        return fetchWithTimeout(`${API_BASE_URL}/statuses`);
      },
      getById: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/statuses/${id}`);
      },
      create: function(statusData) {
        return fetchWithTimeout(`${API_BASE_URL}/statuses`, {
          method: 'POST',
          body: JSON.stringify(statusData)
        });
      },
      update: function(id, statusData) {
        return fetchWithTimeout(`${API_BASE_URL}/statuses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(statusData)
        });
      },
      delete: function(id) {
        return fetchWithTimeout(`${API_BASE_URL}/statuses/${id}`, {
          method: 'DELETE'
        });
      },
      // Bulk update for statuses
      bulkUpdate: function(statusesData) {
        return fetchWithTimeout(`${API_BASE_URL}/statuses/bulk`, {
          method: 'PUT', 
          body: JSON.stringify(statusesData)
        });
      }
    },
    
    // History endpoints
    history: {
      getTaskHistory: function(taskId) {
        return fetchWithTimeout(`${API_BASE_URL}/history/task/${taskId}`);
      }
    },
    
    // Demo data endpoints
    demo: {
      loadDemoData: function() {
        return fetchWithTimeout(`${API_BASE_URL}/demo/load`, { method: 'POST' });
      },
      clearDemoData: function() {
        return fetchWithTimeout(`${API_BASE_URL}/demo/clear`, { method: 'POST' });
      }
    },
    
    // Health check
    checkHealth: function() {
      return fetchWithTimeout(`${API_BASE_URL}/health`)
        .then(() => ({ status: 'ok', message: 'API is operational' }))
        .catch(error => ({ status: 'error', message: error.message }));
    }
  };
})();

// Log to confirm API is initialized
console.log('API service initialized');