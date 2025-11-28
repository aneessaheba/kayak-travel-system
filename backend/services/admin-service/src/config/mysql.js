const mysql = require('mysql2/promise');
const config = require('../config/config');

// Create MySQL connection pool
const pool = mysql.createPool(config.mysql);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL Query Error:', error.message);
    throw error;
  }
};

// Execute query with custom error message
const queryWithError = async (sql, params = [], errorMessage = 'Database query failed') => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error(`${errorMessage}:`, error.message);
    throw new Error(errorMessage);
  }
};

// Get connection from pool (for transactions)
const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Failed to get MySQL connection:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  queryWithError,
  getConnection,
  testConnection
};