# Task Management System

A comprehensive, lightweight task management system built with Express, SQLite, and vanilla JavaScript. This application provides a clean and intuitive interface for tracking tasks across different categories with customizable statuses and powerful filtering capabilities.


## Features

### Core Functionality
- Complete task lifecycle management (create, read, update, delete)
- Customizable categories with color coding and icons
- Flexible status workflows with visual indicators
- Task prioritization system
- Notes and detailed descriptions for tasks
- Status history tracking for each task

### User Interface
- Clean, responsive design that works on desktop and mobile devices
- Intuitive dashboard with status overview cards
- Multiple viewing options (by category, by status, or all tasks)
- Real-time visual indicators of task completion and status
- Dark/light mode support through CSS customization

### Data Management
- Powerful filtering and searching capabilities
- Task sorting and organization
- Demo mode for testing and exploration
- Data import/export functionality
- Status history logging

### Other Features
- No external API dependencies - works completely offline
- Lightweight and fast performance
- Browser-based - no installation required for end users
- Mobile-optimized interface

## Technology Stack

- **Backend**:
  - Node.js with Express
  - SQLite database
  - RESTful API architecture

- **Frontend**:
  - Vanilla JavaScript (no framework dependencies)
  - Modern CSS with flexbox and grid layouts
  - Responsive design with mobile-first approach
  - FontAwesome for icons

## Installation

### Prerequisites
- Node.js (v12 or later)
- npm (v6 or later)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-management.git
cd task-management
```

2. Install dependencies:
```bash
npm install
```


4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Dashboard Overview

The main dashboard provides a quick overview of all tasks by status. Key elements include:

- **Task Counter**: Shows total number of active tasks
- **Status Cards**: Visual representation of tasks in each status
- **New Task Button**: Quick access to create new tasks
- **Settings**: Access application configuration

### Managing Tasks

#### Creating a Task
1. Click the "New Task" card on the dashboard
2. Fill in the task details:
   - Task ID (auto-generated or custom)
   - Description
   - Category
   - Status
   - Priority level
   - Optional notes
3. Click "Save Task"

#### Updating Tasks
- **Change Status**: Use the status dropdown in the task row
- **Mark as Complete**: Click the checkbox in the task row
- **Edit Details**: Click the edit (pencil) icon to modify any task field
- **Delete**: Click the delete (trash) icon to remove a task

### Filtering and Searching

- Use the tab navigation to filter by category or status
- Use the filter inputs in the table header to search by:
  - Task ID
  - Description
  - Category
  - Status
  - Completion status

### Categories and Statuses

#### Managing Categories
1. Navigate to Settings > Categories
2. Add new categories with custom colors and icons
3. Edit or delete existing categories
4. Reorder categories using drag and drop

#### Managing Statuses
1. Navigate to Settings > Statuses
2. Add new statuses with custom colors
3. Edit or delete existing statuses
4. Reorder statuses using drag and drop

### Demo Mode

Demo mode allows you to explore the application with sample data without affecting your actual tasks.

1. Click the flask icon in the top right corner, or
2. Go to Settings > General > Enable Demo Mode

### Data Management

- **Export Data**: Settings > Data Management > Export Data
- **Import Data**: Settings > Data Management > Import Data
- **Clear All Data**: Settings > Data Management > Clear All Data (use with caution)

## API Documentation

The application provides a RESTful API for managing tasks, categories, and statuses.

### Tasks

- `GET /api/tasks` - Get all tasks (with optional filtering)
  - Query parameters:
    - `category`: Filter by category ID
    - `status`: Filter by status ID
    - `search`: Search in task ID and description
    - `done`: Filter by completion status (true/false)
    - `includeDemoTasks`: Include demo tasks (true/false)

- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
  - Required fields: id, description, category_id, status_id
  - Optional fields: notes, priority, is_demo

- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a specific category
- `POST /api/categories` - Create a new category
  - Required fields: name
  - Optional fields: color, icon

- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Statuses

- `GET /api/statuses` - Get all statuses
- `GET /api/statuses/:id` - Get a specific status
- `POST /api/statuses` - Create a new status
  - Required fields: name
  - Optional fields: color

- `PUT /api/statuses/:id` - Update a status
- `DELETE /api/statuses/:id` - Delete a status

### History

- `GET /api/history/task/:id` - Get history for a specific task

### Demo Data

- `POST /api/demo/load` - Load demo data
- `POST /api/demo/clear` - Clear demo data

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
│   │   ├── style.css    # Main CSS styles
│   │   ├── mobile.css   # Mobile-specific styles
│   │   └── demo-mode.css # Demo mode styles
│   └── js/
│       ├── app.js       # Main application code
│       ├── api.js       # API service for backend communication
│       ├── ui.js        # UI components and interactions
│       └── mobile.js    # Mobile-specific enhancements
```

## Customization

### Theme Customization

Edit the CSS variables in `public/css/style.css` to customize the look:

```css
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --secondary-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  /* ...other colors... */
}
```

### Adding Default Categories

Edit the `initDb` function in `db.js` to add additional default categories:

```javascript
await run(`
  INSERT INTO categories (name, color, icon, display_order) VALUES 
  ('Infrastructure & Cloud', '#6366f1', 'server', 1),
  ('Security & Access Control', '#ef4444', 'shield', 2),
  /* Add your custom categories here */
`);
```

### Adding Default Statuses

Edit the `initDb` function in `db.js` to add additional default statuses:

```javascript
await run(`
  INSERT INTO statuses (name, color, display_order) VALUES 
  ('BACKLOG', '#64748b', 1),
  ('ON HOLD', '#b45309', 2),
  /* Add your custom statuses here */
`);
```

## Deployment

### Local Network Deployment

To make the application available on your local network:

```bash
# Specify network interface
npm start -- --host 0.0.0.0
```

### Production Deployment

For production deployment, consider:

1. Using a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name "task-management"
```

2. Setting up a reverse proxy with Nginx or Apache
3. Implementing proper authentication for security

## Browser Compatibility

The application is compatible with:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

Mobile browsers are also supported with a responsive design.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- User authentication and multi-user support
- Task assignments to users
- Due dates and calendar integration
- Email notifications
- File attachments
- Custom fields for tasks
- Enhanced reporting and analytics

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FontAwesome for the icon library
- SortableJS for drag-and-drop functionality

---

For questions and support, please open an issue on the GitHub repository.