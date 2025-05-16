-- SQLite schema for task management system
-- This is for reference - the actual schema is created in db.js

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  display_order INTEGER
);

-- Statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER
);

-- Tasks table
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
);

-- Task history table for tracking status changes
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT,
  status_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks (id),
  FOREIGN KEY (status_id) REFERENCES statuses (id)
);

-- Default categories
INSERT INTO categories (name, color, icon, display_order) VALUES 
('Infrastructure & Cloud', '#6366f1', 'server', 1),
('Security & Access Control', '#ef4444', 'shield', 2),
('Training & Documentation', '#f59e0b', 'book', 3),
('Employee Management', '#8b5cf6', 'users', 4),
('Business Process', '#92400e', 'briefcase', 5),
('Research & Optimization', '#0ea5e9', 'lightbulb', 6);

-- Default statuses
INSERT INTO statuses (name, color, display_order) VALUES 
('BACKLOG', '#64748b', 1),
('ON HOLD', '#b45309', 2),
('TO DO', '#1e40af', 3),
('DEV ONGOING', '#065f46', 4);