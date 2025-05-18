/**
 * UI service for the task management system
 * Handles UI interactions and DOM manipulations
 */

// Global state
let tasks = [];
let categories = [];
let statuses = [];
let currentTab = 'all';
let currentTaskId = null;
let currentCategoryId = null;
let currentStatusId = null;
let pinnedCategories = []; // Stores IDs of categories pinned to the tab bar
let demoModeActive = false;

// Initialize the UI components
function initUI() {
  // Initialize event listeners for tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Initialize "Add Task" button
  document.getElementById('add-task-btn').addEventListener('click', () => {
    showTaskModal();
  });
  
  // Initialize "Add Status" button in the header
  initStatusCardButton();
  
  // Initialize "Add Category" button
  document.getElementById('add-category-btn').addEventListener('click', () => {
    showCategoryModal();
  });
  
  // Initialize task modal events
  document.querySelector('#task-modal .close').addEventListener('click', closeTaskModal);
  document.getElementById('cancel-task').addEventListener('click', closeTaskModal);
  document.getElementById('task-form').addEventListener('submit', handleTaskFormSubmit);
  
  // Initialize category modal events
  document.querySelector('#category-modal .close').addEventListener('click', closeCategoryModal);
  document.getElementById('cancel-category').addEventListener('click', closeCategoryModal);
  document.getElementById('category-form').addEventListener('submit', handleCategoryFormSubmit);
  
  // Initialize status modal events
  document.querySelector('#status-modal .close').addEventListener('click', closeStatusModal);
  document.getElementById('cancel-status').addEventListener('click', closeStatusModal);
  document.getElementById('status-form').addEventListener('submit', handleStatusFormSubmit);
  
  // Initialize category icon preview
  document.getElementById('category-icon').addEventListener('change', updateIconPreview);
  
  // Initialize export button
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // Initialize import button
  document.getElementById('import-data-btn').addEventListener('click', importData);
  
  // Initialize manage categories button
  document.getElementById('manage-categories-btn').addEventListener('click', showCategoryManager);
  
  // Initialize stat cards filters
  document.querySelectorAll('.stat-card[data-status]').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.getAttribute('data-status');
      filterByStatus(status);
    });
  });
  
  // Initialize filters
  document.querySelectorAll('.filter-input, .filter-select').forEach(filter => {
    filter.addEventListener('input', () => {
      applyFilters(currentTab);
    });
  });
  
  // Initialize demo mode button
  const demoModeBtn = document.getElementById('demo-mode-btn');
  if (demoModeBtn) {
    demoModeBtn.addEventListener('click', toggleDemoMode);
  }
  
  // Initialize tooltips for action buttons
  initTooltips();
}

// Switch between tabs
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  
  // Show active content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-content`).classList.add('active');
  
  // If it's the category manager tab, render the category manager
  if (tabName === 'categories') {
    renderCategoryManager();
  }
  
  // If tab doesn't have a table yet, create one
  const contentDiv = document.getElementById(`${tabName}-content`);
  if (tabName !== 'all' && tabName !== 'settings' && tabName !== 'categories' && !contentDiv.querySelector('table')) {
    createCategoryTable(tabName);
  }
  
  // Apply filters for the current tab
  applyFilters(tabName);
}

// Create category-specific table
function createCategoryTable(categoryName) {
  const contentDiv = document.getElementById(`${categoryName}-content`);
  
  // Create table HTML
  const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Done</th>
          <th>Task ID</th>
          <th>Description</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        <tr class="filter-row">
          <th>
            <select class="filter-select filter-done" data-filter="done">
              <option value="">All</option>
              <option value="1">Done</option>
              <option value="0">Not Done</option>
            </select>
          </th>
          <th><input type="text" class="filter-input" data-filter="id" placeholder="Filter..."></th>
          <th><input type="text" class="filter-input" data-filter="description" placeholder="Filter..."></th>
          <th>
            <select class="filter-select" data-filter="status">
              <option value="">All</option>
              ${statuses.map(status => `<option value="${status.id}">${status.name}</option>`).join('')}
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody id="${categoryName}-tbody">
        <!-- Tasks will be populated dynamically -->
      </tbody>
    </table>
  `;
  
  contentDiv.innerHTML = tableHTML;
  
  // Initialize filters for new table
  contentDiv.querySelectorAll('.filter-input, .filter-select').forEach(filter => {
    filter.addEventListener('input', () => {
      applyFilters(categoryName);
    });
  });
}

// Show category manager view
function showCategoryManager() {
  switchTab('categories');
}

// Render category manager with all categories, allowing user to pin/unpin
function renderCategoryManager() {
  const contentDiv = document.getElementById('categories-content');
  
  let html = `
    <div class="category-manager">
      <h2>Manage Categories</h2>
      <p>Pin categories to show them in the main tab bar. You can pin up to 6 categories.</p>
      
      <div class="category-grid">
  `;
  
  // Sort categories by name
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  
  // Generate HTML for each category
  sortedCategories.forEach(category => {
    const isPinned = pinnedCategories.includes(category.id);
    html += `
      <div class="category-card ${isPinned ? 'pinned' : ''}">
        <div class="category-icon" style="background-color: ${category.color || '#6366f1'}">
          <i class="fas fa-${category.icon || 'server'}"></i>
        </div>
        <div class="category-info">
          <h3>${category.name}</h3>
          <span class="task-count">${tasks.filter(t => t.category_id === category.id).length} tasks</span>
        </div>
        <div class="category-actions">
          <button class="pin-btn" onclick="togglePinCategory(${category.id})" title="${isPinned ? 'Unpin from tab bar' : 'Pin to tab bar'}">
            <i class="fas fa-${isPinned ? 'thumbtack' : 'thumbtack'}" style="${isPinned ? 'transform: rotate(45deg);' : ''}"></i>
          </button>
          <button class="action-btn edit-btn" onclick="showCategoryModal(${category.id})" title="Edit Category">
            <i class="fas fa-pencil"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteCategory(${category.id})" title="Delete Category">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      
      <div class="category-manager-actions">
        <button id="add-category-btn-manager" class="btn btn-primary">
          <i class="fas fa-plus"></i> Add Category
        </button>
        <button id="save-category-order-btn" class="btn btn-secondary">
          <i class="fas fa-save"></i> Save Order
        </button>
      </div>
    </div>
  `;
  
  contentDiv.innerHTML = html;
  
  // Initialize "Add Category" button in manager
  document.getElementById('add-category-btn-manager').addEventListener('click', () => {
    showCategoryModal();
  });
  
  // Initialize drag-and-drop for category cards (for future sorting)
  // This would use a library like SortableJS for proper implementation
}

// Toggle pin/unpin for a category
function togglePinCategory(categoryId) {
  const index = pinnedCategories.indexOf(categoryId);
  
  if (index === -1) {
    // Check if we've reached the maximum number of pinned categories
    if (pinnedCategories.length >= 6) {
      showNotification('You can only pin up to 6 categories. Unpin one first.', 'error');
      return;
    }
    
    // Add to pinned categories
    pinnedCategories.push(categoryId);
  } else {
    // Remove from pinned categories
    pinnedCategories.splice(index, 1);
  }
  
  // Save to localStorage
  localStorage.setItem('pinnedCategories', JSON.stringify(pinnedCategories));
  
  // Update the UI
  renderCategoryManager();
  updateTabBar();
}

// Update the tab bar with pinned categories
function updateTabBar() {
  const tabsContainer = document.querySelector('.tabs-container');
  
  // Keep the first tab (All Tasks) and last two tabs (Settings and Categories)
  const firstTab = tabsContainer.querySelector('.tab[data-tab="all"]');
  const statusTab = tabsContainer.querySelector('.tab[data-tab="status"]');
  const settingsTab = tabsContainer.querySelector('.tab[data-tab="settings"]');
  const categoriesTab = tabsContainer.querySelector('.tab[data-tab="categories"]');
  
  // Remove all other tabs
  tabsContainer.querySelectorAll('.tab:not([data-tab="all"]):not([data-tab="status"]):not([data-tab="settings"]):not([data-tab="categories"])').forEach(tab => {
    tab.remove();
  });
  
  // Add pinned category tabs
  let newTabs = [];
  pinnedCategories.forEach(categoryId => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const taskCount = tasks.filter(t => t.category_id === category.id).length;
      const tabClass = getCategoryTabClass(category.id);
      
      const tab = document.createElement('button');
      tab.className = `tab ${tabClass}`;
      tab.setAttribute('data-tab', `category-${category.id}`);
      tab.innerHTML = `
        ${category.name}
        <span class="tab-count">${taskCount}</span>
      `;
      tab.addEventListener('click', () => {
        switchTab(`category-${category.id}`);
      });
      
      newTabs.push(tab);
      
      // Create tab content div if it doesn't exist
      let contentDiv = document.getElementById(`category-${category.id}-content`);
      if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.id = `category-${category.id}-content`;
        contentDiv.className = 'tab-content';
        document.querySelector('.table-container').appendChild(contentDiv);
      }
    }
  });
  
  // Insert the new tabs after the first tab (All Tasks) and before the status tab
  newTabs.forEach(tab => {
    tabsContainer.insertBefore(tab, statusTab);
  });
  
  // Make sure the current tab is still active
  if (currentTab !== 'all' && currentTab !== 'status' && currentTab !== 'settings' && currentTab !== 'categories') {
    const tabExists = document.querySelector(`.tab[data-tab="${currentTab}"]`);
    if (!tabExists) {
      // If the current tab was removed, switch to "all"
      switchTab('all');
    }
  }
}

// Get the appropriate tab class for a category
function getCategoryTabClass(categoryId) {
  const categoryClasses = {
    1: 'infrastructure',
    2: 'security',
    3: 'training',
    4: 'employee',
    5: 'continuity',
    6: 'research'
  };
  
  return categoryClasses[categoryId] || '';
}

// Show task modal for creating or editing a task
function showTaskModal(taskId = null) {
  const modal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('task-form');
  
  // Reset form
  form.reset();
  
  // Populate category dropdown
  const categorySelect = document.getElementById('task-category');
  categorySelect.innerHTML = categories.map(category => 
    `<option value="${category.id}">${category.name}</option>`
  ).join('');
  
  // Populate status dropdown
  const statusSelect = document.getElementById('task-status');
  statusSelect.innerHTML = statuses.map(status => 
    `<option value="${status.id}">${status.name}</option>`
  ).join('');
  
  // If editing existing task
  if (taskId) {
    currentTaskId = taskId;
    modalTitle.textContent = 'Edit Task';
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      document.getElementById('task-id').value = task.id;
      document.getElementById('task-id').disabled = true; // Can't change ID once created
      document.getElementById('task-description').value = task.description;
      document.getElementById('task-category').value = task.category_id;
      document.getElementById('task-status').value = task.status_id;
      document.getElementById('task-priority').value = task.priority || 3;
      document.getElementById('task-notes').value = task.notes || '';
      
      // If the task being edited is a demo task, show a warning
      if (task.is_demo) {
        document.getElementById('demo-task-warning').style.display = 'block';
      } else {
        document.getElementById('demo-task-warning').style.display = 'none';
      }
    }
  } else {
    currentTaskId = null;
    modalTitle.textContent = 'Add New Task';
    document.getElementById('task-id').disabled = false;
    document.getElementById('demo-task-warning').style.display = 'none';
    
    // Generate next task ID
    const cmintdevIds = tasks
      .filter(t => t.id.startsWith('CMINTDEV-'))
      .map(t => parseInt(t.id.replace('CMINTDEV-', ''), 10));
    
    if (cmintdevIds.length > 0) {
      const nextId = Math.max(...cmintdevIds) + 1;
      document.getElementById('task-id').value = `CMINTDEV-${nextId}`;
    } else {
      document.getElementById('task-id').value = 'CMINTDEV-1';
    }
  }
  
  modal.style.display = 'block';
}

// Close task modal
function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
  currentTaskId = null;
}

// Show category modal for creating or editing a category
function showCategoryModal(categoryId = null) {
  const modal = document.getElementById('category-modal');
  const modalTitle = document.getElementById('category-modal-title');
  const form = document.getElementById('category-form');
  
  // Reset form
  form.reset();
  
  // If editing existing category
  if (categoryId) {
    currentCategoryId = categoryId;
    modalTitle.textContent = 'Edit Category';
    
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-color').value = category.color || '#6366f1';
      document.getElementById('category-icon').value = category.icon || 'server';
      updateIconPreview();
    }
  } else {
    currentCategoryId = null;
    modalTitle.textContent = 'Add New Category';
    updateIconPreview();
  }
  
  modal.style.display = 'block';
}

// Close category modal
function closeCategoryModal() {
  document.getElementById('category-modal').style.display = 'none';
  currentCategoryId = null;
}

// Update the renderStatusCards function to enable reordering
function renderStatusCards() {
  const container = document.getElementById('status-cards-container');
  if (!container) return;
  
  // Clear the container
  container.innerHTML = '';
  
  // Sort statuses by display order
  const sortedStatuses = [...statuses].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );
  
  // Create a card for each status
  sortedStatuses.forEach((status) => {
    // Count tasks with this status that are not done
    const statusTasks = tasks.filter(t => 
      t.status_id === status.id && !t.is_done
    ).length;
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.setAttribute('data-status', status.name);
    card.setAttribute('data-status-id', status.id);
    card.style.cursor = 'pointer';
    
    // Set background and text colors based on status color
    if (status.color) {
      // Create a slightly lighter version of the color for the background
      const colorObj = hexToRgb(status.color);
      const bgColor = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, 0.1)`;
      card.style.background = bgColor;
      card.style.borderLeft = `4px solid ${status.color}`;
    }
    
    // Add content
    card.innerHTML = `
      <h3>${status.name}</h3>
      <div class="count" id="${status.name.toLowerCase().replace(/\s+/g, '-')}-count">
        <span class="current-count" style="color: ${status.color || '#64748b'}">${statusTasks}</span>
      </div>
      <div class="card-actions">
        <button class="action-btn edit-btn" onclick="event.stopPropagation(); showStatusModal(${status.id})" title="Edit Status">
          <i class="fas fa-pencil"></i>
        </button>
      </div>
    `;
    
    // Add click event to filter by this status
    card.addEventListener('click', () => {
      filterByStatus(status.name);
    });
    
    // Add to container
    container.appendChild(card);
  });
  
  // Initialize Sortable for status cards reordering
  if (typeof Sortable !== 'undefined' && container.children.length > 0) {
    const statusSortable = Sortable.create(container, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: async function(evt) {
        // Update the display_order of moved statuses
        const statusCards = document.querySelectorAll('#status-cards-container .stat-card');
        
        const updatedOrders = Array.from(statusCards).map((card, index) => {
          const statusId = parseInt(card.getAttribute('data-status-id'), 10);
          return { 
            id: statusId, 
            display_order: (index + 1) * 10 
          };
        });
        
        try {
          // Update status orders in database
          await saveStatusOrders(updatedOrders);
          showNotification('Status order updated', 'success');
        } catch (error) {
          showNotification(`Error updating status order: ${error}`, 'error');
        }
      }
    });
  }
}

// Update the renderStatusManager function to enable reordering
function renderStatusManager() {
  const statusesList = document.getElementById('statuses-list');
  
  if (!statusesList) return;
  
  // Sort statuses by display order
  const sortedStatuses = [...statuses].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );
  
  let html = `
    <div class="status-manager">
      <h2>Manage Statuses</h2>
      <p>Drag and drop statuses to reorder them. These changes will be reflected across the application.</p>
      <div class="status-grid" id="status-sortable-list">
  `;
  
  sortedStatuses.forEach(status => {
    const tasksCount = tasks.filter(t => t.status_id === status.id).length;
    
    html += `
      <div class="status-item sortable-item" data-status-id="${status.id}" style="border-left-color: ${status.color || '#64748b'}">
        <span class="sortable-handle"><i class="fas fa-grip-lines"></i></span>
        <div class="status-item-content">
          <span class="status-item-color" style="background-color: ${status.color || '#64748b'}"></span>
          <span class="status-item-name">${status.name}</span>
          <span class="status-item-count">(${tasksCount} tasks)</span>
        </div>
        <div class="status-item-actions">
          <button class="action-btn edit-btn" onclick="showStatusModal(${status.id})" title="Edit Status">
            <i class="fas fa-pencil"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteStatus(${status.id})" title="Delete Status">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <div class="settings-actions">
        <button id="add-status-btn-manager" class="btn btn-primary">
          <i class="fas fa-plus"></i> Add Status
        </button>
        <span class="order-saved-message" id="status-order-saved">
          <i class="fas fa-check-circle"></i> Order saved
        </span>
      </div>
    </div>
  `;
  
  statusesList.innerHTML = html;
  
  // Initialize the Add Status button in the manager
  const addStatusBtnManager = document.getElementById('add-status-btn-manager');
  if (addStatusBtnManager) {
    addStatusBtnManager.addEventListener('click', () => {
      showStatusModal();
    });
  }
  
  // Initialize Sortable.js for status reordering
  initStatusSorting();
}

// Initialize Sortable.js for status reordering
function initStatusSorting() {
  const sortableList = document.getElementById('status-sortable-list');
  if (typeof Sortable !== 'undefined' && sortableList) {
    const statusSortable = Sortable.create(sortableList, {
      animation: 150,
      handle: '.sortable-handle',
      ghostClass: 'sortable-ghost',
      onEnd: async function(evt) {
        // Update the display_order of moved statuses
        const statusItems = document.querySelectorAll('#status-sortable-list .status-item');
        
        const updatedOrders = Array.from(statusItems).map((item, index) => {
          const statusId = parseInt(item.getAttribute('data-status-id'), 10);
          return { 
            id: statusId, 
            display_order: (index + 1) * 10 
          };
        });
        
        try {
          // Update status orders in database
          await saveStatusOrders(updatedOrders);
          
          // Show saved confirmation
          const savedMsg = document.getElementById('status-order-saved');
          if (savedMsg) {
            savedMsg.classList.add('show');
            setTimeout(() => {
              savedMsg.classList.remove('show');
            }, 2000);
          }
          
          // Refresh status cards to reflect new order
          await loadData(demoModeActive);
        } catch (error) {
          showNotification(`Error updating status order: ${error}`, 'error');
        }
      }
    });
  }
}

// Save status display orders to the database
async function saveStatusOrders(statusOrders) {
  try {
    // Create an array of status update requests
    const updatePromises = statusOrders.map(status => 
      API.statuses.update(status.id, { display_order: status.display_order })
    );
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    
    // Update local statuses array with new display orders
    statusOrders.forEach(update => {
      const statusIndex = statuses.findIndex(s => s.id === update.id);
      if (statusIndex !== -1) {
        statuses[statusIndex].display_order = update.display_order;
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error saving status orders:', error);
    throw error;
  }
}

// Generate status cards from the statuses array
function renderStatusCards() {
  const container = document.getElementById('status-cards-container');
  if (!container) return;
  
  // Clear the container
  container.innerHTML = '';
  
  // Sort statuses by display order
  const sortedStatuses = [...statuses].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );
  
  // Create a card for each status
  sortedStatuses.forEach((status, index) => {
    // Count tasks with this status that are not done
    const statusTasks = tasks.filter(t => 
      t.status_id === status.id && !t.is_done
    ).length;
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.setAttribute('data-status', status.name);
    card.style.cursor = 'pointer';
    
    // Set background and text colors based on status color
    if (status.color) {
      // Create a slightly lighter version of the color for the background
      const colorObj = hexToRgb(status.color);
      const bgColor = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, 0.1)`;
      card.style.background = bgColor;
      card.style.borderLeft = `4px solid ${status.color}`;
    }
    
    // Add content
    card.innerHTML = `
      <h3>${status.name}</h3>
      <div class="count" id="${status.name.toLowerCase().replace(/\s+/g, '-')}-count">
        <span class="current-count" style="color: ${status.color || '#64748b'}">${statusTasks}</span>
      </div>
      <div class="card-actions">
        <button class="action-btn edit-btn" onclick="event.stopPropagation(); showStatusModal(${status.id})" title="Edit Status">
          <i class="fas fa-pencil"></i>
        </button>
      </div>
    `;
    
    // Add click event to filter by this status
    card.addEventListener('click', () => {
      filterByStatus(status.name);
    });
    
    // Add to container
    container.appendChild(card);
  });
  
  // Initialize Sortable for status cards reordering
  if (typeof Sortable !== 'undefined' && container.children.length > 0) {
    const statusSortable = Sortable.create(container, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: async function(evt) {
        // Update the display_order of moved statuses
        const statusCards = document.querySelectorAll('#status-cards-container .stat-card');
        
        const updatedOrders = Array.from(statusCards).map((card, index) => {
          const statusId = parseInt(card.getAttribute('data-status-id'), 10);
          return { 
            id: statusId, 
            display_order: (index + 1) * 10 
          };
        });
        
        try {
          // Update status orders in database
          await saveStatusOrders(updatedOrders);
          showNotification('Status order updated', 'success');
        } catch (error) {
          showNotification(`Error updating status order: ${error}`, 'error');
        }
      }
    });
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the color components
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  }
  
  return { r, g, b };
}

// Update status counts in dynamic cards
function updateDynamicStatusCounts() {
  // Count tasks by status
  const statusCounts = {
    'total': 0
  };
  
  // Initialize counts for all statuses
  statuses.forEach(status => {
    statusCounts[status.name.toLowerCase()] = 0;
  });
  
  // Count active tasks
  tasks.forEach(task => {
    if (!task.is_done) {
      statusCounts.total++;
      
      const statusName = task.status_name?.toLowerCase();
      if (statusName && statusCounts.hasOwnProperty(statusName)) {
        statusCounts[statusName]++;
      }
    }
  });
  
  // Update total count
  document.getElementById('total-count').querySelector('.current-count').textContent = statusCounts.total;
  
  // Update each status card count
  statuses.forEach(status => {
    const countElement = document.getElementById(`${status.name.toLowerCase().replace(/\s+/g, '-')}-count`);
    if (countElement) {
      const countSpan = countElement.querySelector('.current-count');
      if (countSpan) {
        countSpan.textContent = statusCounts[status.name.toLowerCase()] || 0;
      }
    }
  });
}

// Initialize the "New Status" card button
function initStatusCardButton() {
  const addStatusBtn = document.getElementById('add-status-card-btn');
  if (addStatusBtn) {
    addStatusBtn.addEventListener('click', () => {
      showStatusModal();
    });
  }
}

// Show status modal with enhanced color selection
function showStatusModal(statusId = null) {
  const modal = document.getElementById('status-modal');
  const modalTitle = document.getElementById('status-modal-title');
  const form = document.getElementById('status-form');
  
  // Reset form
  form.reset();
  
  // Add color presets if the presets container doesn't exist yet
  if (!document.getElementById('status-color-presets')) {
    const colorField = document.getElementById('status-color').parentNode;
    const presetsContainer = document.createElement('div');
    presetsContainer.id = 'status-color-presets';
    presetsContainer.className = 'color-presets';
    
    // Common status colors
    const presetColors = [
      '#64748b', // Gray (Backlog)
      '#b45309', // Brown (On Hold)
      '#1e40af', // Blue (To Do)
      '#065f46', // Green (Dev Ongoing)
      '#7c2d12', // Dark Orange (Blocked)
      '#9333ea', // Purple (In Review)
      '#b91c1c', // Red (Critical)
      '#0369a1', // Light Blue (In Progress)
      '#15803d', // Light Green (Complete)
      '#92400e'  // Brown (Pending)
    ];
    
    // Create preset buttons
    presetColors.forEach(color => {
      const preset = document.createElement('button');
      preset.type = 'button';
      preset.className = 'color-preset';
      preset.style.backgroundColor = color;
      preset.title = color;
      preset.onclick = (e) => {
        e.preventDefault(); // Prevent form submission
        document.getElementById('status-color').value = color;
        updateStatusColorPreview();
      };
      presetsContainer.appendChild(preset);
    });
    
    // Add presets after the color input
    colorField.appendChild(presetsContainer);
    
    // Add a color preview
    const previewContainer = document.createElement('div');
    previewContainer.className = 'status-preview-container';
    previewContainer.innerHTML = `
      <div class="status-preview">
        <span class="preview-label">Preview:</span>
        <span class="status-badge" id="status-preview-badge">Status</span>
      </div>
    `;
    colorField.appendChild(previewContainer);
    
    // Add event listener to update preview when color changes
    document.getElementById('status-color').addEventListener('input', updateStatusColorPreview);
    document.getElementById('status-name').addEventListener('input', updateStatusColorPreview);
  }
  
  // If editing existing status
  if (statusId) {
    currentStatusId = statusId;
    modalTitle.textContent = 'Edit Status';
    
    const status = statuses.find(s => s.id === statusId);
    if (status) {
      document.getElementById('status-name').value = status.name;
      document.getElementById('status-color').value = status.color || '#64748b';
      updateStatusColorPreview();
    }
  } else {
    currentStatusId = null;
    modalTitle.textContent = 'Add New Status';
    // Set a default color
    document.getElementById('status-color').value = '#64748b';
    updateStatusColorPreview();
  }
  
  modal.style.display = 'block';
}

// Update status preview in modal
function updateStatusColorPreview() {
  const color = document.getElementById('status-color').value;
  const name = document.getElementById('status-name').value || 'Status';
  const previewBadge = document.getElementById('status-preview-badge');
  
  if (previewBadge) {
    previewBadge.textContent = name;
    previewBadge.style.backgroundColor = lightenColor(color, 0.9);
    previewBadge.style.color = color;
  }
}

// Helper function to lighten a color for status badge backgrounds
function lightenColor(color, factor) {
  // Convert hex to rgb
  const rgb = hexToRgb(color);
  
  // Lighten
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  
  // Convert back to hex
  return `rgb(${r}, ${g}, ${b})`;
}

// Close status modal
function closeStatusModal() {
  document.getElementById('status-modal').style.display = 'none';
  currentStatusId = null;
}

// Update icon preview in category modal
function updateIconPreview() {
  const iconSelect = document.getElementById('category-icon');
  const iconPreview = document.querySelector('.icon-preview');
  
  if (iconSelect && iconPreview) {
    const iconValue = iconSelect.value;
    iconPreview.innerHTML = `<i class="fas fa-${iconValue}"></i>`;
  }
}

// Render status manager in settings
function renderStatusManager() {
  const statusesList = document.getElementById('statuses-list');
  
  if (!statusesList) return;
  
  // Sort statuses by display order
  const sortedStatuses = [...statuses].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );
  
  let html = `
    <div class="status-manager">
      <h2>Manage Statuses</h2>
      <div class="status-grid">
  `;
  
  sortedStatuses.forEach(status => {
    const tasksCount = tasks.filter(t => t.status_id === status.id).length;
    
    html += `
      <div class="status-item" data-status-id="${status.id}" style="border-left-color: ${status.color || '#64748b'}">
        <div class="status-item-content">
          <span class="status-sort-handle"><i class="fas fa-grip-lines"></i></span>
          <span class="status-item-color" style="background-color: ${status.color || '#64748b'}"></span>
          <span class="status-item-name">${status.name}</span>
          <span class="status-item-count">(${tasksCount} tasks)</span>
        </div>
        <div class="status-item-actions">
          <button class="action-btn edit-btn" onclick="showStatusModal(${status.id})" title="Edit Status">
            <i class="fas fa-pencil"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteStatus(${status.id})" title="Delete Status">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <button id="add-status-btn-manager" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add Status
      </button>
    </div>
  `;
  
  statusesList.innerHTML = html;
  
  // Initialize the Add Status button in the manager
  const addStatusBtnManager = document.getElementById('add-status-btn-manager');
  if (addStatusBtnManager) {
    addStatusBtnManager.addEventListener('click', () => {
      showStatusModal();
    });
  }
  
  // Initialize drag-and-drop for ordering (would require Sortable.js or similar)
  // This would be implemented similarly to category sorting
}

// Populate statuses in settings
function populateStatuses() {
  renderStatusManager();
  populateStatusDropdowns();
}

// Delete a category
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category? This will not delete tasks assigned to this category, but they will need to be reassigned.')) {
    return;
  }
  
  try {
    await API.categories.delete(categoryId);
    
    // Remove from pinned categories if present
    const index = pinnedCategories.indexOf(categoryId);
    if (index !== -1) {
      pinnedCategories.splice(index, 1);
      localStorage.setItem('pinnedCategories', JSON.stringify(pinnedCategories));
    }
    
    showNotification('Category deleted successfully', 'success');
    loadData(demoModeActive);
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Delete a status
async function deleteStatus(statusId) {
  if (!confirm('Are you sure you want to delete this status? This will not delete tasks with this status, but they will need to be reassigned.')) {
    return;
  }
  
  try {
    await API.statuses.delete(statusId);
    showNotification('Status deleted successfully', 'success');
    
    // Refresh data and UI fully to update status cards
    loadData(demoModeActive);
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Export data as JSON
function exportData() {
  const data = {
    tasks: tasks.filter(t => !t.is_demo), // Don't export demo tasks
    categories,
    statuses,
    pinnedCategories
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `taskmanagement_export_${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showNotification('Data exported successfully', 'success');
}

// Import data from JSON
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('This will replace all existing data. Are you sure you want to continue?')) {
          // TODO: Implement server-side import API
          // For now, we'll just display a success message
          showNotification('Data imported successfully', 'success');
          loadData(demoModeActive);
        }
      } catch (error) {
        showNotification(`Error importing data: ${error}`, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Filter by status
function filterByStatus(status) {
  switchTab('status');
  
  // Set status filter dropdown
  const statusFilter = document.querySelector('#status-content .filter-select[data-filter="status"]');
  if (statusFilter) {
    statusFilter.value = status ? statuses.find(s => s.name === status)?.id || '' : '';
  }
  
  // Apply filters
  applyFilters('status');
}

// Apply filters to a specific tab
function applyFilters(tabName) {
  // Special handling for category tabs
  if (tabName.startsWith('category-')) {
    const categoryId = parseInt(tabName.replace('category-', ''), 10);
    
    // Get all tasks for this category
    const categoryTasks = tasks.filter(t => t.category_id === categoryId);
    
    // Render the table
    renderTasksTable(tabName, categoryTasks);
    return;
  }
  
  // Get all filters for the current tab
  const filterContainers = document.querySelectorAll(`#${tabName}-content .filter-input, #${tabName}-content .filter-select`);
  const filters = Array.from(filterContainers).reduce((acc, filter) => {
    const filterType = filter.getAttribute('data-filter');
    if (filterType && filter.value) {
      acc[filterType] = filter.value.toLowerCase();
    }
    return acc;
  }, {});
  
  // Get the rows for the current tab
  const tbody = document.getElementById(`${tabName}-tbody`);
  if (!tbody) return;
  
  // Skip section headers and empty message rows when filtering
  const rows = Array.from(tbody.querySelectorAll('tr:not(.section-header):not(.empty-state)'));
  
  // Count visible rows for each section
  let visibleActiveRows = 0;
  let visibleCompletedRows = 0;
  
  // Apply filters to each row
  rows.forEach(row => {
    let display = true;
    
    // Check each filter
    Object.entries(filters).forEach(([filterType, filterValue]) => {
      // Handle different filter types
      switch (filterType) {
        case 'id':
          const idCell = row.querySelector('.task-id');
          if (idCell && !idCell.textContent.toLowerCase().includes(filterValue)) {
            display = false;
          }
          break;
        
        case 'description':
          const descCell = row.querySelector('td:nth-child(3)'); // Description is in the 3rd column
          if (descCell && !descCell.textContent.toLowerCase().includes(filterValue)) {
            display = false;
          }
          break;
        
        case 'category':
          const categoryId = row.getAttribute('data-category-id');
          if (categoryId && categoryId !== filterValue) {
            display = false;
          }
          break;
        
        case 'status':
          const statusId = row.getAttribute('data-status-id');
          if (statusId && statusId !== filterValue) {
            display = false;
          }
          break;
        
        case 'done':
          const isDone = row.classList.contains('done');
          if ((filterValue === '1' && !isDone) || (filterValue === '0' && isDone)) {
            display = false;
          }
          break;
      }
    });
    
    // Show or hide the row
    row.classList.toggle('hidden', !display);
    
    // Count visible rows for each section
    if (display) {
      if (row.classList.contains('done')) {
        visibleCompletedRows++;
      } else {
        visibleActiveRows++;
      }
    }
  });
  
  // Update section headers to reflect filtered counts
  const activeHeader = tbody.querySelector('.section-header h3');
  const completedHeader = tbody.querySelector('.completed-section-header h3');
  
  if (activeHeader) {
    activeHeader.textContent = `Active Tasks (${visibleActiveRows})`;
  }
  
  if (completedHeader) {
    completedHeader.textContent = `Completed Tasks (${visibleCompletedRows})`;
  }
  
  // Handle empty sections after filtering
  const activeSectionStart = tbody.querySelector('.section-header');
  const completedSectionStart = tbody.querySelector('.completed-section-header');
  
  if (activeSectionStart) {
    // Get all rows between active section header and completed section header
    const activeRows = Array.from(tbody.querySelectorAll('.section-header ~ tr:not(.completed-section-header):not(.hidden)'));
    const activeRowsExist = activeRows.some(row => !row.classList.contains('section-header') && !row.classList.contains('empty-state'));
    
    // Check if there's already an empty message row
    let emptyMessageRow = Array.from(tbody.querySelectorAll('.section-header ~ tr.empty-state')).find(
      row => row.previousElementSibling === activeSectionStart || 
             Array.from(row.previousElementSibling.classList).includes('section-header')
    );
    
    if (!activeRowsExist && !emptyMessageRow) {
      // Insert empty message row after active section header
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-state';
      emptyRow.innerHTML = `
        <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
          <div class="empty-message">No active tasks match the current filters</div>
        </td>
      `;
      activeSectionStart.after(emptyRow);
    } else if (activeRowsExist && emptyMessageRow) {
      // Remove empty message row if there are now visible rows
      emptyMessageRow.remove();
    }
  }
  
  if (completedSectionStart) {
    // Get all rows after completed section header
    const completedRows = Array.from(tbody.querySelectorAll('.completed-section-header ~ tr:not(.hidden)'));
    const completedRowsExist = completedRows.some(row => !row.classList.contains('section-header') && !row.classList.contains('empty-state'));
    
    // Check if there's already an empty message row
    let emptyMessageRow = Array.from(tbody.querySelectorAll('.completed-section-header ~ tr.empty-state')).find(
      row => row.previousElementSibling === completedSectionStart || 
             Array.from(row.previousElementSibling.classList).includes('completed-section-header')
    );
    
    if (!completedRowsExist && !emptyMessageRow) {
      // Insert empty message row after completed section header
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-state';
      emptyRow.innerHTML = `
        <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
          <div class="empty-message">No completed tasks match the current filters</div>
        </td>
      `;
      completedSectionStart.after(emptyRow);
    } else if (completedRowsExist && emptyMessageRow) {
      // Remove empty message row if there are now visible rows
      emptyMessageRow.remove();
    }
  }
  
  // Update tab count
  updateTabCounts();
}

// Update task done status
async function toggleTaskDone(taskId, isChecked) {
  try {
    await API.tasks.update(taskId, { is_done: isChecked });
    
    // Update task in the tasks array
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].is_done = isChecked;
    }
    
    // Instead of just updating the row style, re-render the entire tables
    // This ensures the task moves to the correct section (active vs completed)
    renderTasks();
    
    // Update counts
    updateStatusCounts();
    updateTabCounts();
    
    // Show a notification
    showNotification(`Task ${isChecked ? 'completed' : 'reopened'}`, 'success');
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
    
    // Revert checkbox
    document.querySelectorAll(`input[data-task-id="${taskId}"]`).forEach(checkbox => {
      checkbox.checked = !isChecked;
    });
  }
}

// Update task status
async function changeTaskStatus(taskId, statusId) {
  try {
    await API.tasks.update(taskId, { status_id: statusId });
    
    // Update task in the tasks array
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].status_id = statusId;
      tasks[taskIndex].status_name = statuses.find(s => s.id == statusId)?.name || '';
    }
    
    // Update UI status badges
    document.querySelectorAll(`tr[data-task-id="${taskId}"] .status-badge`).forEach(badge => {
      const status = statuses.find(s => s.id == statusId);
      if (status) {
        badge.textContent = status.name;
        badge.className = `status-badge status-${status.name.replace(/\s+/g, '-')}`;
      }
    });
    
    // Update counts
    updateStatusCounts();
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
    
    // Revert select
    document.querySelectorAll(`select[data-task-id="${taskId}"]`).forEach(select => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        select.value = task.status_id;
      }
    });
  }
}

// Delete a task
async function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    showNotification('Task not found', 'error');
    return;
  }
  
  let confirmMessage = `Are you sure you want to delete task ${taskId}? This cannot be undone.`;
  
  // Additional warning for demo tasks
  if (task.is_demo) {
    confirmMessage = `This is a demo task. ${confirmMessage}`;
  }
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    await API.tasks.delete(taskId);
    
    // Remove task from the tasks array
    tasks = tasks.filter(t => t.id !== taskId);
    
    // Remove task rows from all tables
    document.querySelectorAll(`tr[data-task-id="${taskId}"]`).forEach(row => {
      row.remove();
    });
    
    // Update counts
    updateStatusCounts();
    updateTabCounts();
    
    showNotification('Task deleted successfully', 'success');
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Update status counts in stats cards
function updateStatusCounts() {
  // This function is now split between:
  // 1. Updating the total count (kept here for backward compatibility)
  // 2. updateDynamicStatusCounts() for the dynamic status cards
  
  // Count total active tasks
  const totalActiveTasks = tasks.filter(task => !task.is_done).length;
  
  // Update total count in the first card
  document.getElementById('total-count').querySelector('.current-count').textContent = totalActiveTasks;
  
  // Call the new function to update dynamic status cards
  updateDynamicStatusCounts();
}

// Update tab counts
function updateTabCounts() {
  // Update the "All" tab count
  const allTabCount = document.querySelector('.tab[data-tab="all"] .tab-count');
  if (allTabCount) {
    // Only count active (non-done) tasks for the tab badge
    const activeTasksCount = tasks.filter(t => !t.is_done).length;
    allTabCount.textContent = activeTasksCount;
  }
  
  // Update the status tab count
  const statusTabCount = document.querySelector('.tab[data-tab="status"] .tab-count');
  if (statusTabCount) {
    // Count visible active rows in the status tab
    const statusTbody = document.getElementById('status-tbody');
    if (statusTbody) {
      const visibleActiveRows = Array.from(statusTbody.querySelectorAll('tr:not(.section-header):not(.empty-state):not(.hidden):not(.done)')).length;
      statusTabCount.textContent = visibleActiveRows;
    }
  }
  
  // Update pinned category tab counts
  pinnedCategories.forEach(categoryId => {
    const tabCount = document.querySelector(`.tab[data-tab="category-${categoryId}"] .tab-count`);
    if (tabCount) {
      // Only count active (non-done) tasks for the category badge
      const activeCategoryTasks = tasks.filter(t => t.category_id === categoryId && !t.is_done).length;
      tabCount.textContent = activeCategoryTasks;
    }
  });
}

// Show a notification
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to container
  container.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, 3000);
}

// Render tasks in a specific table
function renderTasksTable(tabName, taskList) {
  const tbody = document.getElementById(`${tabName}-tbody`);
  if (!tbody) return;
  
  // Sort tasks by display order or ID
  const sortedTasks = [...taskList].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0) || a.id.localeCompare(b.id)
  );
  
  // Separate active and completed tasks
  const activeTasks = sortedTasks.filter(task => !task.is_done);
  const completedTasks = sortedTasks.filter(task => task.is_done);
  
  // Generate HTML for each section
  let tasksHTML = '';
  
  // Active Tasks Section
  tasksHTML += `
    <tr class="section-header">
      <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
        <h3>Active Tasks (${activeTasks.length})</h3>
      </td>
    </tr>
  `;
  
  // If no active tasks, show a message
  if (activeTasks.length === 0) {
    tasksHTML += `
      <tr class="empty-state">
        <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
          <div class="empty-message">No active tasks found</div>
        </td>
      </tr>
    `;
  } else {
    // Render active tasks
    tasksHTML += renderTaskRows(activeTasks, tabName);
  }
  
  // Completed Tasks Section
  tasksHTML += `
    <tr class="section-header completed-section-header">
      <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
        <h3>Completed Tasks (${completedTasks.length})</h3>
      </td>
    </tr>
  `;
  
  // If no completed tasks, show a message
  if (completedTasks.length === 0) {
    tasksHTML += `
      <tr class="empty-state">
        <td colspan="${tabName === 'all' || tabName === 'status' ? '6' : '5'}">
          <div class="empty-message">No completed tasks found</div>
        </td>
      </tr>
    `;
  } else {
    // Render completed tasks
    tasksHTML += renderTaskRows(completedTasks, tabName);
  }
  
  // Update table
  tbody.innerHTML = tasksHTML;
}

// Helper function to render task rows
function renderTaskRows(tasks, tabName) {
  return tasks.map(task => {
    const status = statuses.find(s => s.id == task.status_id) || { name: 'Unknown', color: '#64748b' };
    const statusClassName = `status-${status.name.replace(/\s+/g, '-')}`;
    
    // Add demo task class if this is a demo task
    const demoClass = task.is_demo ? 'demo-task' : '';
    
    // Add done class if the task is completed
    const doneClass = task.is_done ? 'done' : '';
    
    // Generate status options
    const statusOptions = statuses.map(s => 
      `<option value="${s.id}" ${s.id == task.status_id ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    // Base row HTML
    const rowHTML = `
      <tr data-task-id="${task.id}" data-category-id="${task.category_id}" data-status-id="${task.status_id}" class="${doneClass} ${demoClass}">
        <td>
          <input type="checkbox" class="done-checkbox" data-task-id="${task.id}" 
                 ${task.is_done ? 'checked' : ''} 
                 onchange="toggleTaskDone('${task.id}', this.checked)">
        </td>
        <td class="task-id">${task.id}</td>
        <td>${task.description}</td>
        ${tabName === 'all' || tabName === 'status' ? `<td>${task.category_name || 'Unknown'}</td>` : ''}}
        <td><span class="status-badge ${statusClassName}">${status.name}</span></td>
        <td class="actions">
          <select class="status-select" data-task-id="${task.id}" 
                  onchange="changeTaskStatus('${task.id}', this.value)"
                  ${task.is_done ? 'disabled' : ''}>
            ${statusOptions}
          </select>
          <div class="task-actions">
            <button class="action-btn edit-btn" onclick="showTaskModal('${task.id}')" title="Edit Task">
              <i class="fas fa-pencil"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    
    return rowHTML;
  }).join('');
}

// Load data from API and update UI
async function loadData(includeDemoTasks = false) {
  try {
    // Update demo mode status
    demoModeActive = includeDemoTasks;
    
    // Add or remove demo mode class from body
    document.body.classList.toggle('demo-mode', demoModeActive);
    
    // Load pinned categories from localStorage
    const savedPinnedCategories = localStorage.getItem('pinnedCategories');
    if (savedPinnedCategories) {
      pinnedCategories = JSON.parse(savedPinnedCategories);
    } else {
      // Default pinned categories (the original tabs)
      pinnedCategories = [1, 2, 3, 4, 5, 6];
    }
    
    // Load categories, statuses, and tasks in parallel
    const [categoriesData, statusesData, tasksData] = await Promise.all([
      API.categories.getAll(),
      API.statuses.getAll(),
      API.tasks.getAll({ includeDemoTasks: includeDemoTasks })
    ]);
    
    categories = categoriesData;
    statuses = statusesData;
    tasks = tasksData;
    
    // Update UI with the new data
    updateTabBar();
    renderTasks();
    populateCategories();
    populateStatuses();
    
    // Render dynamic status cards and update counts
    renderStatusCards();
    updateDynamicStatusCounts();
    
    updateTabCounts();
    populateFilterDropdowns();
    
    // If we're on the categories tab, render the category manager
    if (currentTab === 'categories') {
      renderCategoryManager();
    }
    
    // Update demo mode toggle in settings
    const demoToggle = document.getElementById('demo-mode-toggle');
    if (demoToggle) {
      demoToggle.checked = demoModeActive;
    }
  } catch (error) {
    showNotification(`Error loading data: ${error}`, 'error');
  }
}

// Populate filter dropdowns with categories and statuses
function populateFilterDropdowns() {
  // Category dropdowns
  document.querySelectorAll('.filter-select[data-filter="category"]').forEach(select => {
    const currentValue = select.value;
    
    select.innerHTML = `
      <option value="">All</option>
      ${categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('')}
    `;
    
    // Restore selected value if possible
    if (currentValue) {
      select.value = currentValue;
    }
  });
  
  // Status dropdowns
  document.querySelectorAll('.filter-select[data-filter="status"]').forEach(select => {
    const currentValue = select.value;
    
    select.innerHTML = `
      <option value="">All</option>
      ${statuses.map(status => `<option value="${status.id}">${status.name}</option>`).join('')}
    `;
    
    // Restore selected value if possible
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

// Render tasks in all tables
function renderTasks() {
  // All tasks table
  renderTasksTable('all', tasks);
  
  // Status table
  renderTasksTable('status', tasks);
  
  // Category-specific tabs
  pinnedCategories.forEach(categoryId => {
    const categoryTasks = tasks.filter(t => t.category_id === categoryId);
    renderTasksTable(`category-${categoryId}`, categoryTasks);
  });
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

// Export UI functions for global access
const ui = {
  initUI,
  showTaskModal,
  closeTaskModal,
  showCategoryModal,
  closeCategoryModal,
  showStatusModal,
  closeStatusModal,
  toggleTaskDone,
  changeTaskStatus,
  deleteTask,
  deleteCategory,
  deleteStatus,
  filterByStatus,
  updateIconPreview,
  togglePinCategory,
  loadData,
  showNotification,
  toggleDemoMode
};

window.ui = ui;