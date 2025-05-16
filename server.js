const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Task Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const { category, status, search, done } = req.query;
    const tasks = await db.getTasks(category, status, search, done);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { id, description, category_id, status_id, notes, priority } = req.body;
    
    // Validate required fields
    if (!id || !description || !category_id || !status_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const taskId = await db.createTask(id, description, category_id, status_id, notes, priority);
    const task = await db.getTaskById(taskId);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { description, category_id, status_id, is_done, notes, priority, display_order } = req.body;
    
    // First check if task exists
    const existingTask = await db.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await db.updateTask(
      req.params.id, 
      description, 
      category_id, 
      status_id, 
      is_done, 
      notes, 
      priority, 
      display_order
    );
    
    // If status changed, log in history
    if (status_id && status_id !== existingTask.status_id) {
      await db.addTaskHistory(req.params.id, status_id);
    }
    
    const updatedTask = await db.getTaskById(req.params.id);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    // First delete task history
    await db.deleteTaskHistory(req.params.id);
    
    // Then delete the task
    await db.deleteTask(req.params.id);
    
    res.json({ message: `Task ${req.params.id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update for tasks
app.put('/api/tasks/bulk', async (req, res) => {
  try {
    const tasks = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Expected an array of tasks' });
    }
    
    const results = [];
    for (const task of tasks) {
      if (!task.id) {
        results.push({ 
          id: null, 
          success: false, 
          error: 'Missing task ID' 
        });
        continue;
      }
      
      try {
        await db.updateTask(
          task.id, 
          task.description, 
          task.category_id, 
          task.status_id, 
          task.is_done, 
          task.notes, 
          task.priority, 
          task.display_order
        );
        
        results.push({ 
          id: task.id, 
          success: true 
        });
      } catch (err) {
        results.push({ 
          id: task.id, 
          success: false, 
          error: err.message 
        });
      }
    }
    
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Category Routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await db.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const categoryId = await db.createCategory(name, color, icon);
    const category = await db.getCategoryById(categoryId);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, color, icon, display_order } = req.body;
    
    await db.updateCategory(req.params.id, name, color, icon, display_order);
    const category = await db.getCategoryById(req.params.id);
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    // Check if category is used in any tasks
    const tasksWithCategory = await db.getTasksCountByCategory(req.params.id);
    if (tasksWithCategory > 0) {
      return res.status(400).json({ 
        error: `Cannot delete: category is used by ${tasksWithCategory} tasks` 
      });
    }
    
    await db.deleteCategory(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status Routes
app.get('/api/statuses', async (req, res) => {
  try {
    const statuses = await db.getStatuses();
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/statuses/:id', async (req, res) => {
  try {
    const status = await db.getStatusById(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/statuses', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Status name is required' });
    }
    
    const statusId = await db.createStatus(name, color);
    const status = await db.getStatusById(statusId);
    res.status(201).json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/statuses/:id', async (req, res) => {
  try {
    const { name, color, display_order } = req.body;
    
    await db.updateStatus(req.params.id, name, color, display_order);
    const status = await db.getStatusById(req.params.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/statuses/:id', async (req, res) => {
  try {
    // Check if status is used in any tasks
    const tasksWithStatus = await db.getTasksCountByStatus(req.params.id);
    if (tasksWithStatus > 0) {
      return res.status(400).json({ 
        error: `Cannot delete: status is used by ${tasksWithStatus} tasks` 
      });
    }
    
    await db.deleteStatus(req.params.id);
    res.json({ message: 'Status deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// History Routes
app.get('/api/history/task/:id', async (req, res) => {
  try {
    const history = await db.getTaskHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo Data Routes
app.post('/api/demo/load', async (req, res) => {
  try {
    // Sample tasks with default categories and statuses
    const demoTasks = [
      {
        id: 'CMINTDEV-242',
        description: 'Set up anti-virus for EC2 servers',
        category_id: 1, // Infrastructure & Cloud
        status_id: 4,   // DEV ONGOING
        priority: 2,
        notes: 'Need to research compatible options for our EC2 setup'
      },
      {
        id: 'CMINTDEV-32',
        description: 'OMV hardware inventory',
        category_id: 1, // Infrastructure & Cloud
        status_id: 4,   // DEV ONGOING
        priority: 3,
        notes: 'Document all hardware specs and serial numbers'
      },
      {
        id: 'CMINTDEV-271',
        description: 'Set up HTTPS license for OVTime',
        category_id: 1, // Infrastructure & Cloud
        status_id: 3,   // TO DO
        priority: 1,
        notes: 'Current certificate expires next month'
      },
      {
        id: 'CMINTDEV-23',
        description: 'Review security groups open ports',
        category_id: 2, // Security & Access Control
        status_id: 1,   // BACKLOG
        priority: 3
      },
      {
        id: 'CMINTDEV-33',
        description: 'Routine security review',
        category_id: 2, // Security & Access Control
        status_id: 2,   // ON HOLD
        priority: 2,
        notes: 'Waiting for new security policy to be approved'
      },
      {
        id: 'CMINTDEV-215',
        description: 'Create company privacy policy',
        category_id: 3, // Training & Documentation
        status_id: 4,   // DEV ONGOING
        priority: 2,
        notes: 'Draft ready for review by legal team'
      },
      {
        id: 'CMINTDEV-216',
        description: 'Create company information security policy',
        category_id: 3, // Training & Documentation
        status_id: 4,   // DEV ONGOING
        priority: 2,
        notes: 'Working with security team on requirements'
      },
      {
        id: 'CMINTDEV-8',
        description: 'Put a plan for cross training/backup for all dev projects',
        category_id: 5, // Business Process
        status_id: 4,   // DEV ONGOING
        priority: 2,
        notes: 'Identify critical projects and single points of knowledge'
      },
      {
        id: 'CMINTDEV-319',
        description: 'Review AWS bill and suggest ways to reduce costs',
        category_id: 6, // Research & Optimization
        status_id: 4,   // DEV ONGOING
        priority: 3,
        notes: 'Focus on unused resources and right-sizing instances'
      }
    ];
    
    // Create each task (will skip if task ID already exists)
    for (const task of demoTasks) {
      try {
        // Check if task already exists
        const existingTask = await db.getTaskById(task.id);
        if (!existingTask) {
          await db.createTask(
            task.id, 
            task.description, 
            task.category_id, 
            task.status_id, 
            task.notes, 
            task.priority
          );
        }
      } catch (err) {
        console.warn(`Warning: Could not create demo task ${task.id}: ${err.message}`);
      }
    }
    
    res.json({ success: true, message: 'Demo data loaded successfully' });
  } catch (err) {
    console.error('Error loading demo data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all data (DANGEROUS - for testing only)
app.post('/api/demo/clear', async (req, res) => {
  try {
    // Delete all tasks and their history
    await db.clearAllData();
    
    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});