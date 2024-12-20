// db-connection.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

let db = null;

function initializeDatabase() {
  if (!db) { // Prevent multiple connections
    db = mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASS,
      database: process.env.DATABASE,
    });

    db.connect((err) => {
      if (err) {
        console.log("Database connection error: " + err);
      } else {
        console.log("MySQL Connection Success");
      }
    });

    db.on('error', (err) => {
      console.error('Database error:', err);
      db = null; // Reset the db if there's an error
    });
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = { initializeDatabase, getDb };
