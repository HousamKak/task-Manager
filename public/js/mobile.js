/**
 * Mobile optimizations for the task management system
 * This file contains JavaScript enhancements for mobile devices
 */

// Global mobile state
let isMobile = window.innerWidth <= 768;
let touchStartX = 0;
let touchStartY = 0;
let swipeThreshold = 50;
let pullToRefreshThreshold = 80;
let isPulling = false;
let lastScrollTop = 0;
let activeSwipeRow = null;

// Initialize mobile features
function initMobileFeatures() {
  // Check if we're on a mobile device
  isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    console.log('Mobile mode activated');
    
    // Add necessary elements to DOM
    addMobileElements();
    
    // Initialize mobile event listeners
    initMobileEventListeners();
    
    // Make tables responsive
    makeTablesResponsive();
    
    // Initialize swipe actions
    initSwipeActions();
    
    // Initialize pull to refresh
    initPullToRefresh();
    
    // Initialize scroll behavior
    initScrollBehavior();
  }
}

// Add mobile-specific elements to the DOM
function addMobileElements() {
  // Add floating action button for adding tasks
  if (!document.querySelector('.mobile-fab')) {
    const fab = document.createElement('div');
    fab.className = 'mobile-fab';
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.addEventListener('click', () => {
      showTaskModal();
    });
    document.body.appendChild(fab);
  }
  
  // Add filter toggle button for each table
  document.querySelectorAll('.tab-content table').forEach(table => {
    const tableContainer = table.closest('.tab-content');
    
    if (!tableContainer.querySelector('.filter-toggle-btn')) {
      const filterToggleBtn = document.createElement('button');
      filterToggleBtn.className = 'filter-toggle-btn mobile-only';
      filterToggleBtn.innerHTML = '<i class="fas fa-filter"></i> Show Filters';
      filterToggleBtn.addEventListener('click', function() {
        tableContainer.classList.toggle('mobile-filters-active');
        this.innerHTML = tableContainer.classList.contains('mobile-filters-active') 
          ? '<i class="fas fa-filter"></i> Hide Filters' 
          : '<i class="fas fa-filter"></i> Show Filters';
      });
      
      table.parentNode.insertBefore(filterToggleBtn, table);
    }
  });
  
  // Add category selector dropdown instead of tabs
  if (!document.querySelector('.mobile-category-selector') && document.querySelectorAll('.tab[data-tab^="category-"]').length > 0) {
    const selector = document.createElement('select');
    selector.className = 'mobile-category-selector mobile-only';
    
    // Add "All Tasks" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Tasks';
    selector.appendChild(allOption);
    
    // Add category options
    document.querySelectorAll('.tab[data-tab^="category-"]').forEach(tab => {
      const option = document.createElement('option');
      option.value = tab.getAttribute('data-tab');
      option.textContent = tab.textContent.trim().split('\n')[0]; // Remove the count
      selector.appendChild(option);
    });
    
    // Add status option
    const statusOption = document.createElement('option');
    statusOption.value = 'status';
    statusOption.textContent = 'By Status';
    selector.appendChild(statusOption);
    
    // Add event listener
    selector.addEventListener('change', function() {
      switchTab(this.value);
    });
    
    // Insert after tabs container
    const tabsContainer = document.querySelector('.tabs-container');
    tabsContainer.parentNode.insertBefore(selector, tabsContainer.nextSibling);
  }
  
  // Add pull-to-refresh indicator
  if (!document.querySelector('.pull-to-refresh')) {
    const pullToRefresh = document.createElement('div');
    pullToRefresh.className = 'pull-to-refresh';
    pullToRefresh.innerHTML = '<span class="refresh-icon"><i class="fas fa-sync-alt"></i></span> Pull to refresh';
    document.querySelector('.dashboard').insertBefore(pullToRefresh, document.querySelector('.dashboard').firstChild);
  }
  
  // Add fixed header for scroll
  if (!document.querySelector('.mobile-fixed-header')) {
    const fixedHeader = document.createElement('div');
    fixedHeader.className = 'mobile-fixed-header';
    fixedHeader.innerHTML = `
      <h2>Tech Committee Backlog</h2>
      <div class="mobile-fixed-header-actions">
        <button class="action-btn" id="mobile-filter-btn"><i class="fas fa-filter"></i></button>
        <button class="action-btn" id="mobile-add-btn"><i class="fas fa-plus"></i></button>
      </div>
    `;
    document.body.appendChild(fixedHeader);
    
    // Add event listeners
    document.getElementById('mobile-add-btn').addEventListener('click', () => {
      showTaskModal();
    });
    
    document.getElementById('mobile-filter-btn').addEventListener('click', () => {
      const activeContent = document.querySelector('.tab-content.active');
      activeContent.classList.toggle('mobile-filters-active');
    });
  }
  
  // Add bottom navigation
  if (!document.querySelector('.mobile-bottom-nav')) {
    const bottomNav = document.createElement('div');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.innerHTML = `
      <a href="#" class="bottom-nav-item active" data-tab="all">
        <i class="fas fa-list"></i>
        <span>Tasks</span>
      </a>
      <a href="#" class="bottom-nav-item" data-tab="status">
        <i class="fas fa-tag"></i>
        <span>Status</span>
      </a>
      <a href="#" class="bottom-nav-item" data-tab="categories">
        <i class="fas fa-folder"></i>
        <span>Categories</span>
      </a>
      <a href="#" class="bottom-nav-item" data-tab="settings">
        <i class="fas fa-cog"></i>
        <span>Settings</span>
      </a>
    `;
    document.body.appendChild(bottomNav);
    
    // Add event listeners
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = item.getAttribute('data-tab');
        switchTab(tabName);
        
        // Update active state
        bottomNav.querySelectorAll('.bottom-nav-item').forEach(navItem => {
          navItem.classList.remove('active');
        });
        item.classList.add('active');
      });
    });
  }
}

// Initialize mobile event listeners
function initMobileEventListeners() {
  // Listen for orientation changes
  window.addEventListener('orientationchange', function() {
    // Delay execution to allow browser to complete the rotation
    setTimeout(function() {
      isMobile = window.innerWidth <= 768;
      
      // Re-apply mobile optimizations
      if (isMobile) {
        makeTablesResponsive();
      }
    }, 200);
  });
  
  // Listen for resize events
  window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    // If switching between mobile and desktop, refresh
    if (wasMobile !== isMobile) {
      location.reload();
    }
  });
}

// Make tables responsive on mobile
function makeTablesResponsive() {
  if (!isMobile) return;
  
  // Add responsive class to table containers
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('responsive-table-container');
  });
}

// Initialize swipe actions for task rows
function initSwipeActions() {
  if (!isMobile) return;
  
  // Setup swipe containers for each task row
  setupSwipeContainers();
  
  // Add touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Setup swipe containers for task rows
function setupSwipeContainers() {
  document.querySelectorAll('tr[data-task-id]').forEach(row => {
    // Skip if already setup
    if (row.classList.contains('swipe-setup')) return;
    
    // Mark as setup
    row.classList.add('swipe-setup');
    
    // Create swipe container
    const rowContent = document.createElement('div');
    rowContent.className = 'swipe-row-content';
    
    // Move all children to the container
    while (row.firstChild) {
      rowContent.appendChild(row.firstChild);
    }
    
    // Create swipe actions
    const swipeActions = document.createElement('div');
    swipeActions.className = 'swipe-actions';
    swipeActions.innerHTML = `
      <button class="swipe-action-btn swipe-edit"><i class="fas fa-pencil"></i></button>
      <button class="swipe-action-btn swipe-delete"><i class="fas fa-trash"></i></button>
    `;
    
    // Add event listeners to action buttons
    const editBtn = swipeActions.querySelector('.swipe-edit');
    const deleteBtn = swipeActions.querySelector('.swipe-delete');
    const taskId = row.getAttribute('data-task-id');
    
    editBtn.addEventListener('click', () => {
      showTaskModal(taskId);
      resetSwipeState();
    });
    
    deleteBtn.addEventListener('click', () => {
      deleteTask(taskId);
      resetSwipeState();
    });
    
    // Make the row a swipe container
    row.classList.add('swipe-actions-container');
    
    // Append the container and actions
    row.appendChild(rowContent);
    row.appendChild(swipeActions);
  });
}

// Handle touch start event
function handleTouchStart(e) {
  if (!isMobile) return;
  
  // Store the starting position
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  
  // Check if we're touching a task row
  const swipeContainer = e.target.closest('.swipe-actions-container');
  if (swipeContainer) {
    // Reset any previously active swipe row
    if (activeSwipeRow && activeSwipeRow !== swipeContainer) {
      activeSwipeRow.classList.remove('revealed');
    }
    activeSwipeRow = swipeContainer;
  }
  
  // Check if we're pulling from the top of the active content
  const activeContent = document.querySelector('.tab-content.active');
  if (activeContent && activeContent.scrollTop === 0) {
    const pullToRefresh = document.querySelector('.pull-to-refresh');
    pullToRefresh.innerHTML = '<span class="refresh-icon"><i class="fas fa-sync-alt"></i></span> Pull to refresh';
    isPulling = true;
  }
}

// Handle touch move event
function handleTouchMove(e) {
  if (!isMobile) return;
  
  // Calculate the distance moved
  const touchCurrentX = e.touches[0].clientX;
  const touchCurrentY = e.touches[0].clientY;
  const deltaX = touchStartX - touchCurrentX;
  const deltaY = touchStartY - touchCurrentY;
  
  // Handle horizontal swipe for task rows - ONLY prevent default when necessary
  if (Math.abs(deltaX) > Math.abs(deltaY) && activeSwipeRow && Math.abs(deltaX) > 10) {
    // Prevent default ONLY when actively swiping horizontally on a row
    e.preventDefault();
    
    if (deltaX > swipeThreshold) {
      // Swiping left - reveal actions
      activeSwipeRow.classList.add('revealed');
    } else if (deltaX < -swipeThreshold) {
      // Swiping right - hide actions
      activeSwipeRow.classList.remove('revealed');
    }
  }
  
  // Handle pull to refresh - ONLY at the very top of the content and with correct direction
  if (isPulling && deltaY < -5 && Math.abs(deltaY) > Math.abs(deltaX)) {
    const pullToRefresh = document.querySelector('.pull-to-refresh');
    pullToRefresh.classList.add('visible');
    
    // Calculate pull distance percentage
    const pullDistance = Math.abs(deltaY);
    
    // Update message based on pull distance
    if (pullDistance >= pullToRefreshThreshold) {
      pullToRefresh.innerHTML = '<span class="refresh-icon"><i class="fas fa-sync-alt"></i></span> Release to refresh';
      // ONLY prevent default when we've pulled enough to trigger a refresh
      e.preventDefault();
    }
  }
}

// Handle touch end event
function handleTouchEnd(e) {
  if (!isMobile) return;
  
  // Handle pull to refresh release
  if (isPulling) {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    
    if (deltaY < -pullToRefreshThreshold) {
      // Trigger refresh
      const pullToRefresh = document.querySelector('.pull-to-refresh');
      pullToRefresh.classList.add('refreshing');
      pullToRefresh.innerHTML = '<span class="refresh-icon"><i class="fas fa-sync-alt fa-spin"></i></span> Refreshing...';
      
      // Refresh data - this calls loadData() from app.js
      loadData().then(() => {
        // Reset pull to refresh state
        setTimeout(() => {
          pullToRefresh.classList.remove('visible');
          pullToRefresh.classList.remove('refreshing');
          setTimeout(() => {
            pullToRefresh.innerHTML = '<span class="refresh-icon"><i class="fas fa-sync-alt"></i></span> Pull to refresh';
          }, 300);
        }, 1000);
      });
    } else {
      // Reset without refreshing
      const pullToRefresh = document.querySelector('.pull-to-refresh');
      pullToRefresh.classList.remove('visible');
    }
    
    isPulling = false;
  }
}

// Reset swipe state
function resetSwipeState() {
  if (activeSwipeRow) {
    activeSwipeRow.classList.remove('revealed');
    activeSwipeRow = null;
  }
}

// Initialize pull to refresh
function initPullToRefresh() {
  // Already implemented in the touch handling
}

// Initialize scroll behavior
function initScrollBehavior() {
  if (!isMobile) return;
  
  // Handle scroll events for showing/hiding fixed header
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const fixedHeader = document.querySelector('.mobile-fixed-header');
    
    if (scrollTop > 100 && scrollTop > lastScrollTop) {
      // Scrolling down past threshold - show header
      fixedHeader.classList.add('visible');
    } else if (scrollTop < lastScrollTop || scrollTop < 50) {
      // Scrolling up or at top - hide header
      fixedHeader.classList.remove('visible');
    }
    
    lastScrollTop = scrollTop;
  });
}

// Update mobile UI after task changes
function updateMobileUI() {
  if (!isMobile) return;
  
  // Re-setup swipe containers for any new tasks
  setupSwipeContainers();
  
  // Update bottom navigation counts
  updateBottomNavCounts();
}

// Update bottom navigation counts
function updateBottomNavCounts() {
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (!bottomNav) return;
  
  // Update task count for all tasks
  const allTasksCount = tasks.length;
  const allTasksItem = bottomNav.querySelector('[data-tab="all"]');
  
  if (allTasksItem) {
    const countBadge = allTasksItem.querySelector('.count-badge');
    if (allTasksCount > 0) {
      if (countBadge) {
        countBadge.textContent = allTasksCount;
      } else {
        const badge = document.createElement('span');
        badge.className = 'count-badge';
        badge.textContent = allTasksCount;
        allTasksItem.appendChild(badge);
      }
    } else if (countBadge) {
      countBadge.remove();
    }
  }
}

// Add ripple effect to buttons
function addRippleEffect() {
  const buttons = document.querySelectorAll('.btn, .action-btn, .tab, .mobile-fab');
  
  buttons.forEach(button => {
    button.classList.add('ripple');
  });
}

// Initialize vibration feedback
function initVibrationFeedback() {
  if (!isMobile || !navigator.vibrate) return;
  
  // Add vibration to buttons
  document.querySelectorAll('.btn, .action-btn, .mobile-fab').forEach(button => {
    button.addEventListener('click', () => {
      navigator.vibrate(10); // Short vibration
    });
  });
  
  // Add vibration to checkbox changes
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('done-checkbox')) {
      navigator.vibrate(10); // Short vibration
    }
  });
  
  // Add vibration to swipe actions
  document.querySelectorAll('.swipe-action-btn').forEach(button => {
    button.addEventListener('click', () => {
      navigator.vibrate([10, 30, 10]); // Pattern vibration
    });
  });
}

// Optimize images and icons for mobile
function optimizeImages() {
  // Use SVG icons when possible for better scaling
  // Already using Font Awesome which is optimized
}

// Initialize lazy loading
function initLazyLoading() {
  if (!isMobile) return;
  
  // Implement lazy loading for tables with many rows
  document.querySelectorAll('.tab-content').forEach(content => {
    const tbody = content.querySelector('tbody');
    if (!tbody) return;
    
    // If there are many rows, consider lazy loading
    if (tbody.children.length > 50) {
      const visibleRows = 20;
      const rows = Array.from(tbody.children);
      
      // Hide rows beyond the visible limit
      rows.slice(visibleRows).forEach(row => {
        row.classList.add('hidden', 'lazy-hidden');
      });
      
      // Add load more button
      const loadMoreRow = document.createElement('tr');
      loadMoreRow.className = 'load-more-row';
      loadMoreRow.innerHTML = `
        <td colspan="6">
          <button class="btn btn-secondary load-more-btn">Load More</button>
        </td>
      `;
      tbody.appendChild(loadMoreRow);
      
      // Add event listener
      loadMoreRow.querySelector('.load-more-btn').addEventListener('click', function() {
        // Show next batch of rows
        const hiddenRows = rows.filter(row => row.classList.contains('lazy-hidden'));
        const nextBatch = hiddenRows.slice(0, visibleRows);
        
        nextBatch.forEach(row => {
          row.classList.remove('hidden', 'lazy-hidden');
        });
        
        // Remove load more button if no more hidden rows
        if (hiddenRows.length <= visibleRows) {
          this.closest('.load-more-row').remove();
        }
      });
    }
  });
}

// Expose functions to global scope
window.mobileUI = {
  initMobileFeatures,
  updateMobileUI,
  resetSwipeState,
  addRippleEffect,
  initVibrationFeedback,
  optimizeImages,
  initLazyLoading
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile features
  initMobileFeatures();
  
  // Add ripple effect
  addRippleEffect();
  
  // Initialize vibration feedback
  initVibrationFeedback();
  
  // Optimize images
  optimizeImages();
  
  // Initialize lazy loading
  initLazyLoading();
  
  console.log('Mobile UI initialized');
});

// Update mobile UI after data changes
// Override or extend existing functions

// Override original renderTasks to include mobile updates
const originalRenderTasks = window.renderTasks || function() {};
window.renderTasks = function() {
  // Call the original function first
  originalRenderTasks.apply(this, arguments);
  
  // Then update mobile-specific UI
  if (typeof window.mobileUI !== 'undefined') {
    window.mobileUI.updateMobileUI();
  }
};

// Override showTaskModal to reset swipe state
const originalShowTaskModal = window.showTaskModal || function() {};
window.showTaskModal = function() {
  // Call the original function first
  originalShowTaskModal.apply(this, arguments);
  
  // Then reset swipe state
  if (typeof window.mobileUI !== 'undefined') {
    window.mobileUI.resetSwipeState();
  }
};