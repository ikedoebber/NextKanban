const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'kanban.db');
const db = new Database(dbPath);

console.log('Checking users in database:');
const users = db.prepare('SELECT * FROM users').all();
console.log('Users found:', users);

console.log('\nChecking tasks table structure:');
const tasksSchema = db.prepare('PRAGMA table_info(tasks)').all();
console.log('Tasks table schema:', tasksSchema);

console.log('\nChecking goals table structure:');
const goalsSchema = db.prepare('PRAGMA table_info(goals)').all();
console.log('Goals table schema:', goalsSchema);

db.close();