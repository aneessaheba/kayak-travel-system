const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'kayak',
  connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('✗ MySQL Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { pool, testConnection };