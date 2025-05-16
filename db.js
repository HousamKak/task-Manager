const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'taskmanagement.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Helper function to run queries with promises
function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
}

// Helper function for querying data
function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

// Helper function for querying multiple rows
function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Initialize database tables
async function initDb() {
  // Settings table for app configuration
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      display_order INTEGER
    )
  `);

  // Statuses table
  await run(`
    CREATE TABLE IF NOT EXISTS statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT,
      display_order INTEGER
    )
  `);

  // Tasks table
  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      category_id INTEGER,
      status_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_done BOOLEAN DEFAULT 0,
      notes TEXT,
      priority INTEGER DEFAULT 3,
      display_order INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (status_id) REFERENCES statuses (id)
    )
  `);

  // Task history table
  await run(`
    CREATE TABLE IF NOT EXISTS task_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      status_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks (id),
      FOREIGN KEY (status_id) REFERENCES statuses (id)
    )
  `);

  // Insert default categories if they don't exist
  const categoriesCount = await get('SELECT COUNT(*) as count FROM categories');
  if (categoriesCount.count === 0) {
    await run(`
      INSERT INTO categories (name, color, icon, display_order) VALUES 
      ('Infrastructure & Cloud', '#6366f1', 'server', 1),
      ('Security & Access Control', '#ef4444', 'shield', 2),
      ('Training & Documentation', '#f59e0b', 'book', 3),
      ('Employee Management', '#8b5cf6', 'users', 4),
      ('Business Process', '#92400e', 'briefcase', 5),
      ('Research & Optimization', '#0ea5e9', 'lightbulb', 6)
    `);
  }

  // Insert default statuses if they don't exist
  const statusesCount = await get('SELECT COUNT(*) as count FROM statuses');
  if (statusesCount.count === 0) {
    await run(`
      INSERT INTO statuses (name, color, display_order) VALUES 
      ('BACKLOG', '#64748b', 1),
      ('ON HOLD', '#b45309', 2),
      ('TO DO', '#1e40af', 3),
      ('DEV ONGOING', '#065f46', 4)
    `);
  }
  
  // Set initialization flag
  await setSetting('db_initialized', 'true');
  
  console.log('Database initialization complete');
}

// Settings operations
async function getSetting(key) {
  const row = await get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

async function setSetting(key, value) {
  const existing = await getSetting(key);
  if (existing !== null) {
    await run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
  } else {
    await run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

// Task operations
async function getTasks(categoryId, statusId, searchTerm, isDone) {
  let query = `
    SELECT t.*, c.name as category_name, s.name as status_name 
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN statuses s ON t.status_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (categoryId) {
    query += ` AND t.category_id = ?`;
    params.push(categoryId);
  }
  
  if (statusId) {
    query += ` AND t.status_id = ?`;
    params.push(statusId);
  }
  
  if (searchTerm) {
    query += ` AND (t.id LIKE ? OR t.description LIKE ?)`;
    const searchPattern = `%${searchTerm}%`;
    params.push(searchPattern, searchPattern);
  }
  
  if (isDone !== undefined) {
    query += ` AND t.is_done = ?`;
    params.push(isDone === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY t.display_order ASC, t.id ASC';
  
  return await all(query, params);
}

async function getTaskById(id) {
  return await get(`
    SELECT t.*, c.name as category_name, s.name as status_name 
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN statuses s ON t.status_id = s.id
    WHERE t.id = ?
  `, [id]);
}

async function createTask(id, description, categoryId, statusId, notes, priority) {
  // Check if task already exists
  const existingTask = await get('SELECT id FROM tasks WHERE id = ?', [id]);
  if (existingTask) {
    throw new Error(`Task with ID ${id} already exists`);
  }
  
  // Get the max display_order
  const maxOrder = await get('SELECT MAX(display_order) as max_order FROM tasks');
  const displayOrder = (maxOrder.max_order || 0) + 10; // Increment by 10 to allow reordering
  
  await run(`
    INSERT INTO tasks(id, description, category_id, status_id, notes, priority, display_order) 
    VALUES(?, ?, ?, ?, ?, ?, ?)
  `, [id, description, categoryId, statusId, notes, priority || 3, displayOrder]);
  
  // Add initial status to history
  await addTaskHistory(id, statusId, 'Task created');
  
  return id;
}

async function updateTask(id, description, categoryId, statusId, isDone, notes, priority, displayOrder) {
  const updatedAt = new Date().toISOString();
  
  // Build the dynamic part of the query
  let query = 'UPDATE tasks SET updated_at = ?';
  const params = [updatedAt];
  
  if (description !== undefined) {
    query += ', description = ?';
    params.push(description);
  }
  
  if (categoryId !== undefined) {
    query += ', category_id = ?';
    params.push(categoryId);
  }
  
  if (statusId !== undefined) {
    query += ', status_id = ?';
    params.push(statusId);
  }
  
  if (isDone !== undefined) {
    query += ', is_done = ?';
    params.push(isDone ? 1 : 0);
  }
  
  if (notes !== undefined) {
    query += ', notes = ?';
    params.push(notes);
  }
  
  if (priority !== undefined) {
    query += ', priority = ?';
    params.push(priority);
  }
  
  if (displayOrder !== undefined) {
    query += ', display_order = ?';
    params.push(displayOrder);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  await run(query, params);
}

async function deleteTask(id) {
  await run('DELETE FROM tasks WHERE id = ?', [id]);
}

async function addTaskHistory(taskId, statusId, notes = null) {
  await run('INSERT INTO task_history(task_id, status_id, notes) VALUES(?, ?, ?)', [taskId, statusId, notes]);
}

async function getTaskHistory(taskId) {
  return await all(`
    SELECT h.*, s.name as status_name, s.color as status_color
    FROM task_history h
    LEFT JOIN statuses s ON h.status_id = s.id
    WHERE h.task_id = ?
    ORDER BY h.timestamp DESC
  `, [taskId]);
}

async function deleteTaskHistory(taskId) {
  await run('DELETE FROM task_history WHERE task_id = ?', [taskId]);
}

// Category operations
async function getCategories() {
  return await all('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
}

async function getCategoryById(id) {
  return await get('SELECT * FROM categories WHERE id = ?', [id]);
}

async function createCategory(name, color, icon) {
  // Get the max display_order
  const maxOrder = await get('SELECT MAX(display_order) as max_order FROM categories');
  const displayOrder = (maxOrder.max_order || 0) + 10;
  
  return await run(
    'INSERT INTO categories(name, color, icon, display_order) VALUES(?, ?, ?, ?)',
    [name, color, icon, displayOrder]
  );
}

async function updateCategory(id, name, color, icon, displayOrder) {
  const fields = [];
  const params = [];
  
  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }
  
  if (color !== undefined) {
    fields.push('color = ?');
    params.push(color);
  }
  
  if (icon !== undefined) {
    fields.push('icon = ?');
    params.push(icon);
  }
  
  if (displayOrder !== undefined) {
    fields.push('display_order = ?');
    params.push(displayOrder);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  params.push(id);
  await run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function deleteCategory(id) {
  await run('DELETE FROM categories WHERE id = ?', [id]);
}

async function getTasksCountByCategory(categoryId) {
  const result = await get('SELECT COUNT(*) as count FROM tasks WHERE category_id = ?', [categoryId]);
  return result.count;
}

// Status operations
async function getStatuses() {
  return await all('SELECT * FROM statuses ORDER BY display_order ASC, name ASC');
}

async function getStatusById(id) {
  return await get('SELECT * FROM statuses WHERE id = ?', [id]);
}

async function createStatus(name, color) {
  // Get the max display_order
  const maxOrder = await get('SELECT MAX(display_order) as max_order FROM statuses');
  const displayOrder = (maxOrder.max_order || 0) + 10;
  
  return await run(
    'INSERT INTO statuses(name, color, display_order) VALUES(?, ?, ?)',
    [name, color, displayOrder]
  );
}

async function updateStatus(id, name, color, displayOrder) {
  const fields = [];
  const params = [];
  
  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }
  
  if (color !== undefined) {
    fields.push('color = ?');
    params.push(color);
  }
  
  if (displayOrder !== undefined) {
    fields.push('display_order = ?');
    params.push(displayOrder);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  params.push(id);
  await run(`UPDATE statuses SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function deleteStatus(id) {
  await run('DELETE FROM statuses WHERE id = ?', [id]);
}

async function getTasksCountByStatus(statusId) {
  const result = await get('SELECT COUNT(*) as count FROM tasks WHERE status_id = ?', [statusId]);
  return result.count;
}

// Clear all data (DANGEROUS - for testing only)
async function clearAllData() {
  await run('DELETE FROM task_history');
  await run('DELETE FROM tasks');
  // Don't delete categories and statuses to keep the default ones
  
  console.log('All data cleared successfully');
}

// Initialize the database on module load
async function checkAndInitDb() {
  try {
    // Check if the database has been initialized
    const initialized = await getSetting('db_initialized');
    if (!initialized) {
      console.log('Database not initialized, running setup...');
      await initDb();
    } else {
      console.log('Database already initialized');
    }
  } catch (err) {
    // If there's an error (like the settings table doesn't exist yet), initialize
    console.log('Database initialization status unknown, running setup...');
    await initDb();
  }
}

// Run initialization check
checkAndInitDb().catch(err => {
  console.error('Database initialization error:', err.message);
});

// Export database functions
module.exports = {
  // Task operations
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskHistory,
  getTaskHistory,
  deleteTaskHistory,
  
  // Category operations
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getTasksCountByCategory,
  
  // Status operations
  getStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
  getTasksCountByStatus,
  
  // Settings operations
  getSetting,
  setSetting,
  
  // Data management
  clearAllData,
  
  // Initialization
  initDb
};