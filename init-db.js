const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const db = require('./db');

// Path to the database file
const dbPath = path.join(__dirname, 'taskmanagement.db');

// Check if the database exists, if not, create it
if (!fs.existsSync(dbPath)) {
  console.log('Database file not found, initializing new database...');
  
  // Create file if it doesn't exist
  fs.writeFileSync(dbPath, '');
  
  // Initialize the database structure
  db.initDb()
    .then(() => {
      console.log('Database structure initialized successfully');
      console.log('To start the application, run: npm start');
    })
    .catch(err => {
      console.error('Error initializing database:', err.message);
    });
} else {
  console.log('Database already exists at:', dbPath);
  console.log('To start the application, run: npm start');
}