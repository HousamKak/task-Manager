/**
 * Main application script for the task management system
 * Initializes the application and connects the API and UI services
 */

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Task Management System initializing...');
  
  // Initialize UI components
  ui.initUI();
  
  // Load data (without demo data)
  loadData();
  
  console.log('Task Management System initialized');
});

// Load all data from the API
async function loadData() {
  try {
    // Load actual data from API
    await ui.loadData();
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification(`Failed to load data: ${error}`, 'error');
  }
}

// Show a notification
function showNotification(message, type = 'info') {
  ui.showNotification(message, type);
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
window.togglePinCategory = ui.togglePinCategory;

// Load demo data (only when explicitly requested)
window.loadDemoData = async function() {
  if (!confirm('This will load demo data and may overwrite existing tasks. Continue?')) {
    return;
  }
  
  try {
    // Call the demo data endpoint
    const response = await fetch('/api/demo/load', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      showNotification('Demo data loaded successfully', 'success');
      // Reload data to reflect changes
      await loadData();
    } else {
      showNotification(`Failed to load demo data: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error loading demo data:', error);
    showNotification(`Failed to load demo data: ${error}`, 'error');
  }
};

// Clear all data (for testing)
window.clearAllData = async function() {
  if (!confirm('This will DELETE ALL TASKS, CATEGORIES, and STATUSES. This cannot be undone. Are you absolutely sure?')) {
    return;
  }
  
  try {
    // Call the clear data endpoint
    const response = await fetch('/api/demo/clear', { method: 'POST' });
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
};