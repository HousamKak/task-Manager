# Task Management System

A simple and lightweight task management system built with Express, SQLite, and vanilla JavaScript.

## Features

- Task tracking with CRUD operations
- Categorization and status management
- Filtering and sorting
- Status history tracking
- Clean, responsive UI
- Custom categories and statuses
- Export and import data

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-management.git
cd task-management
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## File Structure

```
task-management/
├── package.json         # Project dependencies and scripts
├── server.js            # Express server and API endpoints
├── db.js                # Database operations and utility functions
├── init-db.js           # Database initialization script
├── schema.sql           # SQL schema (for reference)
├── public/              # Client-side files
│   ├── index.html       # Main HTML template
│   ├── css/
│   │   └── style.css    # CSS styles
│   └── js/
│       ├── app.js       # Main application code
│       ├── api.js       # API service for backend communication
│       └── ui.js        # UI components and interactions
```

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks (with optional filtering)
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Statuses
- `GET /api/statuses` - Get all statuses
- `POST /api/statuses` - Create a new status
- `PUT /api/statuses/:id` - Update a status
- `DELETE /api/statuses/:id` - Delete a status

## Usage

### Task Management
- Click the "New Task" card to create a new task
- Use the tabs to navigate between different categories
- Use the filter rows to search and filter tasks
- Click on the checkboxes to mark tasks as done
- Use the status dropdown to change task status
- Use the edit and delete buttons to manage tasks

### Settings
- Click the gear icon tab to access settings
- Manage categories and statuses
- Export and import your data

## Customization

### Change Theme Colors
Edit the CSS variables in `public/css/style.css` to customize the look:

```css
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --secondary-color: #10b981;
  /* ...other colors... */
}
```

### Add Default Categories or Statuses
Edit the `initDb` function in `db.js` to add additional default categories or statuses.

## License

MIT