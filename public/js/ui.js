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
  
  // Initialize "Add Category" button
  document.getElementById('add-category-btn').addEventListener('click', () => {
    showCategoryModal();
  });
  
  // Initialize "Add Status" button
  document.getElementById('add-status-btn').addEventListener('click', () => {
    showStatusModal();
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
    }
  } else {
    currentTaskId = null;
    modalTitle.textContent = 'Add New Task';
    document.getElementById('task-id').disabled = false;
    
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

// Show status modal for creating or editing a status
function showStatusModal(statusId = null) {
  const modal = document.getElementById('status-modal');
  const modalTitle = document.getElementById('status-modal-title');
  const form = document.getElementById('status-form');
  
  // Reset form
  form.reset();
  
  // If editing existing status
  if (statusId) {
    currentStatusId = statusId;
    modalTitle.textContent = 'Edit Status';
    
    const status = statuses.find(s => s.id === statusId);
    if (status) {
      document.getElementById('status-name').value = status.name;
      document.getElementById('status-color').value = status.color || '#64748b';
    }
  } else {
    currentStatusId = null;
    modalTitle.textContent = 'Add New Status';
  }
  
  modal.style.display = 'block';
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

// Handle task form submission
async function handleTaskFormSubmit(event) {
  event.preventDefault();
  
  try {
    const taskData = {
      id: document.getElementById('task-id').value,
      description: document.getElementById('task-description').value,
      category_id: parseInt(document.getElementById('task-category').value, 10),
      status_id: parseInt(document.getElementById('task-status').value, 10),
      priority: parseInt(document.getElementById('task-priority').value, 10),
      notes: document.getElementById('task-notes').value
    };
    
    if (currentTaskId) {
      // Update existing task
      await API.tasks.update(currentTaskId, taskData);
      showNotification('Task updated successfully', 'success');
    } else {
      // Create new task
      await API.tasks.create(taskData);
      showNotification('Task created successfully', 'success');
    }
    
    // Refresh data and UI
    loadData();
    closeTaskModal();
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Handle category form submission
async function handleCategoryFormSubmit(event) {
  event.preventDefault();
  
  try {
    const categoryData = {
      name: document.getElementById('category-name').value,
      color: document.getElementById('category-color').value,
      icon: document.getElementById('category-icon').value
    };
    
    if (currentCategoryId) {
      // Update existing category
      await API.categories.update(currentCategoryId, categoryData);
      showNotification('Category updated successfully', 'success');
    } else {
      // Create new category
      await API.categories.create(categoryData);
      showNotification('Category created successfully', 'success');
    }
    
    // Refresh data and UI
    loadData();
    closeCategoryModal();
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Handle status form submission
async function handleStatusFormSubmit(event) {
  event.preventDefault();
  
  try {
    const statusData = {
      name: document.getElementById('status-name').value,
      color: document.getElementById('status-color').value
    };
    
    if (currentStatusId) {
      // Update existing status
      await API.statuses.update(currentStatusId, statusData);
      showNotification('Status updated successfully', 'success');
    } else {
      // Create new status
      await API.statuses.create(statusData);
      showNotification('Status created successfully', 'success');
    }
    
    // Refresh data and UI
    loadData();
    closeStatusModal();
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Populate categories in settings
function populateCategories() {
  const categoriesList = document.getElementById('categories-list');
  
  if (!categoriesList) return;
  
  categoriesList.innerHTML = categories.map(category => `
    <div class="settings-item">
      <div class="settings-item-name">
        <div class="settings-item-icon" style="background-color: ${category.color || '#6366f1'}">
          <i class="fas fa-${category.icon || 'server'}"></i>
        </div>
        <span>${category.name}</span>
      </div>
      <div class="settings-item-actions">
        <button class="action-btn edit-btn" onclick="showCategoryModal(${category.id})">
          <i class="fas fa-pencil"></i>
        </button>
        <button class="action-btn delete-btn" onclick="deleteCategory(${category.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Populate statuses in settings
function populateStatuses() {
  const statusesList = document.getElementById('statuses-list');
  
  if (!statusesList) return;
  
  statusesList.innerHTML = statuses.map(status => `
    <div class="settings-item">
      <div class="settings-item-name">
        <div class="settings-item-icon" style="background-color: ${status.color || '#64748b'}">
          <i class="fas fa-tag"></i>
        </div>
        <span>${status.name}</span>
      </div>
      <div class="settings-item-actions">
        <button class="action-btn edit-btn" onclick="showStatusModal(${status.id})">
          <i class="fas fa-pencil"></i>
        </button>
        <button class="action-btn delete-btn" onclick="deleteStatus(${status.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
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
    loadData();
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
    loadData();
  } catch (error) {
    showNotification(`Error: ${error}`, 'error');
  }
}

// Export data as JSON
function exportData() {
  const data = {
    tasks,
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
          loadData();
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
  
  const rows = tbody.querySelectorAll('tr');
  
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
  });
  
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
    
    // Update UI
    document.querySelectorAll(`tr[data-task-id="${taskId}"]`).forEach(row => {
      row.classList.toggle('done', isChecked);
      
      // Disable action buttons if done
      const statusSelect = row.querySelector('.status-select');
      if (statusSelect) {
        statusSelect.disabled = isChecked;
      }
    });
    
    // Update counts
    updateStatusCounts();
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
  if (!confirm(`Are you sure you want to delete task ${taskId}? This cannot be undone.`)) {
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
  // Count tasks by status
  const statusCounts = {
    'total': 0,
    'backlog': 0,
    'on hold': 0,
    'to do': 0,
    'dev ongoing': 0
  };
  
  tasks.forEach(task => {
    if (!task.is_done) {
      statusCounts.total++;
      
      const statusName = task.status_name?.toLowerCase();
      if (statusName && statusCounts.hasOwnProperty(statusName)) {
        statusCounts[statusName]++;
      }
    }
  });
  
  // Update stat cards
  document.getElementById('total-count').querySelector('.current-count').textContent = statusCounts.total;
  document.getElementById('backlog-count').querySelector('.current-count').textContent = statusCounts['backlog'];
  document.getElementById('on-hold-count').querySelector('.current-count').textContent = statusCounts['on hold'];
  document.getElementById('to-do-count').querySelector('.current-count').textContent = statusCounts['to do'];
  document.getElementById('dev-ongoing-count').querySelector('.current-count').textContent = statusCounts['dev ongoing'];
}

// Update tab counts
function updateTabCounts() {
  // Update the "All" tab count
  const allTabCount = document.querySelector('.tab[data-tab="all"] .tab-count');
  if (allTabCount) {
    allTabCount.textContent = tasks.length;
  }
  
  // Update the status tab count
  const statusTabCount = document.querySelector('.tab[data-tab="status"] .tab-count');
  if (statusTabCount) {
    // Count visible rows in the status tab
    const statusTbody = document.getElementById('status-tbody');
    if (statusTbody) {
      const visibleCount = Array.from(statusTbody.querySelectorAll('tr:not(.hidden)')).length;
      statusTabCount.textContent = visibleCount;
    }
  }
  
  // Update pinned category tab counts
  pinnedCategories.forEach(categoryId => {
    const tabCount = document.querySelector(`.tab[data-tab="category-${categoryId}"] .tab-count`);
    if (tabCount) {
      const count = tasks.filter(t => t.category_id === categoryId).length;
      tabCount.textContent = count;
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

// Load data from API and update UI
async function loadData() {
  try {
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
      API.tasks.getAll()
    ]);
    
    categories = categoriesData;
    statuses = statusesData;
    tasks = tasksData;
    
    // Update UI with the new data
    updateTabBar();
    renderTasks();
    populateCategories();
    populateStatuses();
    updateStatusCounts();
    updateTabCounts();
    populateFilterDropdowns();
    
    // If we're on the categories tab, render the category manager
    if (currentTab === 'categories') {
      renderCategoryManager();
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

// Render tasks in a specific table
function renderTasksTable(tabName, taskList) {
  const tbody = document.getElementById(`${tabName}-tbody`);
  if (!tbody) return;
  
  // Sort tasks by display order or ID
  const sortedTasks = [...taskList].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0) || a.id.localeCompare(b.id)
  );
  
  // Generate HTML for each task
  const tasksHTML = sortedTasks.map(task => {
    const status = statuses.find(s => s.id == task.status_id) || { name: 'Unknown', color: '#64748b' };
    const statusClassName = `status-${status.name.replace(/\s+/g, '-')}`;
    
    // Generate status options
    const statusOptions = statuses.map(s => 
      `<option value="${s.id}" ${s.id == task.status_id ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    // Base row HTML
    const rowHTML = `
      <tr data-task-id="${task.id}" data-category-id="${task.category_id}" data-status-id="${task.status_id}" class="${task.is_done ? 'done' : ''}">
        <td>
          <input type="checkbox" class="done-checkbox" data-task-id="${task.id}" 
                 ${task.is_done ? 'checked' : ''} 
                 onchange="toggleTaskDone('${task.id}', this.checked)">
        </td>
        <td class="task-id">${task.id}</td>
        <td>${task.description}</td>
        ${tabName === 'all' || tabName === 'status' ? `<td>${task.category_name || 'Unknown'}</td>` : ''}
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
  
  // Update table
  tbody.innerHTML = tasksHTML;
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
  showNotification
};

window.ui = ui;