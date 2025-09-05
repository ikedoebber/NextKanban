const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'kanban.db');
const db = new Database(dbPath);

try {
  console.log('=== DATABASE INFO ===');
  console.log('Database path:', dbPath);
  
  console.log('\n=== CHECKING TABLES ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found:', tables.length);
  tables.forEach(table => {
    console.log(`Table: ${table.name}`);
  });
  
  if (tables.some(t => t.name === 'users')) {
    console.log('\n=== USERS IN DATABASE ===');
    const users = db.prepare('SELECT id, username, email FROM users').all();
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
  } else {
    console.log('\n=== USERS TABLE NOT FOUND ===');
    console.log('The users table does not exist in the database!');
  }
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}