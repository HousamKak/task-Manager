/**
 * Mobile-specific enhancements for the task management system
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile-specific behaviors
  initMobileEnhancements();
});

function initMobileEnhancements() {
  // Check if the device is mobile
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    console.log('Mobile device detected. Initializing mobile enhancements.');
    
    // Add swipe to dismiss for notifications
    initSwipeToDismiss();
    
    // Apply mobile-specific adjustments
    adjustForMobileView();
    
    // Add fastclick to remove 300ms delay on touch devices
    initFastClick();
    
    // Add pull-to-refresh functionality
    initPullToRefresh();
  }
  
  // Add resize listener to handle orientation changes
  window.addEventListener('resize', handleResize);
}

// Handle window resize/orientation change
function handleResize() {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    adjustForMobileView();
  } else {
    // Restore desktop view if necessary
    restoreDesktopView();
  }
}

// Apply mobile-specific UI adjustments
function adjustForMobileView() {
  // Simplify the header on mobile
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    // Make sure only essential buttons are shown on mobile
    headerActions.classList.add('mobile-view');
  }
  
  // Make sure tables are scrollable horizontally
  document.querySelectorAll('table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

// Restore desktop view
function restoreDesktopView() {
  // Remove mobile-specific classes
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    headerActions.classList.remove('mobile-view');
  }
  
  // Unwrap tables if they were wrapped for mobile scrolling
  document.querySelectorAll('.table-scroll-wrapper').forEach(wrapper => {
    const table = wrapper.querySelector('table');
    if (table) {
      wrapper.parentNode.insertBefore(table, wrapper);
      wrapper.remove();
    }
  });
}

// Initialize swipe to dismiss for notifications
function initSwipeToDismiss() {
  // This would add touch event listeners to notification elements
  // For a full implementation, you would need to use a touch library or implement
  // touchstart, touchmove, and touchend event handling
  console.log('Swipe to dismiss initialized for notifications');
}

// Remove 300ms delay on touch devices
function initFastClick() {
  // This would initialize a solution like FastClick.js
  // For a full implementation, you would include FastClick library
  console.log('FastClick initialized');
}

// Add pull-to-refresh functionality
function initPullToRefresh() {
  // This would implement pull-to-refresh functionality
  // For a full implementation, you would use a library or custom implementation
  console.log('Pull-to-refresh initialized');
}

// Export functions for global access if needed
window.refreshData = function() {
  console.log('Refreshing data from mobile interface...');
  loadData();
};