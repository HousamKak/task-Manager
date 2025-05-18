/**
 * Main application script for the task management system
 * Initializes the application and connects the API and UI services
 */

// Global state
let demoMode = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Task Management System initializing...');
  
  // Initialize UI components
  ui.initUI();
  
  // Load data (without demo data)
  loadData();
  
  // Initialize demo mode toggle
  initDemoMode();
  
  console.log('Task Management System initialized');
});

// Initialize demo mode toggle
function initDemoMode() {
  const demoToggle = document.getElementById('demo-mode-toggle');
  if (demoToggle) {
    demoToggle.addEventListener('change', function() {
      demoMode = this.checked;
      
      if (demoMode) {
        loadDemoData();
      } else {
        // When turning off demo mode, reload regular data
        clearDemoData().then(() => loadData());
      }
      
      // Update UI indication
      document.body.classList.toggle('demo-mode', demoMode);
      
      // Update notification
      if (demoMode) {
        showNotification('Demo mode activated. These tasks won\'t affect your real data.', 'info');
      } else {
        showNotification('Demo mode deactivated. Returned to your actual tasks.', 'info');
      }
    });
  }
  
  // Initialize demo mode button in header
  const demoModeBtn = document.getElementById('demo-mode-btn');
  if (demoModeBtn) {
    demoModeBtn.addEventListener('click', toggleDemoMode);
  }
}

// Load all data from the API
async function loadData() {
  try {
    // Load actual data from API, excluding demo tasks
    await ui.loadData(false);
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification(`Failed to load data: ${error}`, 'error');
  }
}

// Show a notification
function showNotification(message, type = 'info') {
  ui.showNotification(message, type);
}

// Load demo data
async function loadDemoData() {
  try {
    // Call the demo data endpoint to ensure demo data exists
    const response = await fetch('/api/demo/load', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      // Load data including demo tasks
      await ui.loadData(true);
      showNotification('Demo mode active. Demo tasks loaded.', 'success');
    } else {
      showNotification(`Failed to load demo data: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error loading demo data:', error);
    showNotification(`Failed to load demo data: ${error}`, 'error');
  }
}

// Clear demo data
async function clearDemoData() {
  try {
    // Call the clear demo data endpoint
    const response = await fetch('/api/demo/clear', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      showNotification('Demo data cleared', 'success');
    } else {
      showNotification(`Failed to clear demo data: ${result.error}`, 'error');
    }
    
    return result;
  } catch (error) {
    console.error('Error clearing demo data:', error);
    showNotification(`Failed to clear demo data: ${error}`, 'error');
    throw error;
  }
}

// Toggle demo mode
function toggleDemoMode() {
  const demoToggle = document.getElementById('demo-mode-toggle');
  if (demoToggle) {
    demoToggle.checked = !demoToggle.checked;
    // Trigger the change event
    demoToggle.dispatchEvent(new Event('change'));
  }
}

// Clear all data (for testing)
async function clearAllData() {
  if (!confirm('This will DELETE ALL TASKS. This cannot be undone. Are you absolutely sure?')) {
    return;
  }
  
  try {
    // Call the clear data endpoint
    const response = await fetch('/api/data/clear', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      showNotification('All data cleared successfully', 'success');
      // Reload data to reflect changes
      await loadData();
    } else {
      showNotification(`Failed to clear data: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    showNotification(`Failed to clear data: ${error}`, 'error');
  }
}

// Export functions for global access
window.loadData = loadData;
window.showNotification = showNotification;
window.showTaskModal = ui.showTaskModal;
window.closeTaskModal = ui.closeTaskModal;
window.showCategoryModal = ui.showCategoryModal;
window.closeCategoryModal = ui.closeCategoryModal;
window.showStatusModal = ui.showStatusModal;
window.closeStatusModal = ui.closeStatusModal;
window.toggleTaskDone = ui.toggleTaskDone;
window.changeTaskStatus = ui.changeTaskStatus;
window.deleteTask = ui.deleteTask;
window.deleteCategory = ui.deleteCategory;
window.deleteStatus = ui.deleteStatus;
window.filterByStatus = ui.filterByStatus;
window.updateIconPreview = ui.updateIconPreview;
window.showSettingsModal = ui.showSettingsModal;
window.closeSettingsModal = ui.closeSettingsModal;
window.switchSettingsTab = ui.switchSettingsTab;
window.clearAllData = clearAllData;
window.toggleDemoMode = toggleDemoMode;