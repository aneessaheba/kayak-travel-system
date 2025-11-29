const { pool } = require('../config/database');
const { RedisUtil } = require('../config/redis');
const bcrypt = require('bcryptjs');

/**
 * User Model - Handles all database operations with Redis caching
 * Cache Strategy:
 * - Cache keys: user:id:{user_id} and user:email:{email}
 * - TTL: 1 hour (3600 seconds)
 * - Invalidate on: UPDATE, DELETE
 */

const UserModel = {
  
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Object} Created user (without password)
   */
  async createUser(userData) {
    const connection = await pool.getConnection();
    
    try {
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const query = `
        INSERT INTO users (
          user_id, first_name, last_name, email, password,
          address, city, state, zip_code, phone_number, profile_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        userData.user_id,
        userData.first_name,
        userData.last_name,
        userData.email,
        hashedPassword,
        userData.address || null,
        userData.city || null,
        userData.state || null,
        userData.zip_code || null,
        userData.phone_number || null,
        userData.profile_image || null
      ];
      
      await connection.query(query, values);
      
      // Get created user (without password)
      const [rows] = await connection.query(
        'SELECT user_id, first_name, last_name, email, address, city, state, zip_code, phone_number, profile_image, created_at FROM users WHERE user_id = ?',
        [userData.user_id]
      );
      
      const user = rows[0];
      
      // Cache the new user
      await RedisUtil.set(`user:id:${user.user_id}`, user);
      await RedisUtil.set(`user:email:${user.email}`, user);
      
      return user;
      
    } catch (error) {
      // Check for duplicate entry
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          throw new Error('duplicate_email: Email already exists');
        } else {
          throw new Error('duplicate_user: User ID already exists');
        }
      }
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Get user by ID (with Redis caching)
   * @param {String} userId - User SSN
   * @returns {Object|null} User object or null
   */
  async getUserById(userId) {
    // Check cache first
    const cacheKey = `user:id:${userId}`;
    let user = await RedisUtil.get(cacheKey);
    
    if (user) {
      console.log(`[CACHE HIT] User ${userId} from Redis`);
      return user;
    }
    
    console.log(`[CACHE MISS] User ${userId} - querying MySQL`);
    
    // Not in cache, query database
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, address, city, state, zip_code, phone_number, profile_image, created_at, updated_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    user = rows[0] || null;
    
    // Cache for future requests
    if (user) {
      await RedisUtil.set(cacheKey, user);
      // Also cache by email for faster email lookups
      await RedisUtil.set(`user:email:${user.email}`, user);
    }
    
    return user;
  },

  /**
   * Get user by email (with Redis caching)
   * @param {String} email - User email
   * @returns {Object|null} User object or null
   */
  async getUserByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    
    // Check cache first
    const cacheKey = `user:email:${normalizedEmail}`;
    let user = await RedisUtil.get(cacheKey);
    
    if (user) {
      console.log(`[CACHE HIT] User ${normalizedEmail} from Redis`);
      return user;
    }
    
    console.log(`[CACHE MISS] User ${normalizedEmail} - querying MySQL`);
    
    // Not in cache, query database
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, address, city, state, zip_code, phone_number, profile_image, created_at, updated_at FROM users WHERE email = ?',
      [normalizedEmail]
    );
    
    user = rows[0] || null;
    
    // Cache for future requests
    if (user) {
      await RedisUtil.set(cacheKey, user);
      // Also cache by ID
      await RedisUtil.set(`user:id:${user.user_id}`, user);
    }
    
    return user;
  },

  /**
   * Update user information
   * @param {String} userId - User SSN
   * @param {Object} updateData - Fields to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Build dynamic update query (only update provided fields)
      const updateFields = [];
      const values = [];
      
      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      // Build SET clause dynamically
      const allowedFields = [
        'first_name', 'last_name', 'email', 'password',
        'address', 'city', 'state', 'zip_code', 'phone_number', 'profile_image'
      ];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      // Add userId to values
      values.push(userId);
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
      
      const [result] = await connection.query(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('user_not_found: User does not exist');
      }
      
      // Get updated user
      const [rows] = await connection.query(
        'SELECT user_id, first_name, last_name, email, address, city, state, zip_code, phone_number, profile_image, created_at, updated_at FROM users WHERE user_id = ?',
        [userId]
      );
      
      const user = rows[0];
      
      await connection.commit();
      
      // Invalidate ALL caches for this user (by ID and email)
      await RedisUtil.delPattern(`user:id:${userId}`);
      await RedisUtil.delPattern(`user:email:*`); // Email might have changed
      
      // Cache the updated user
      await RedisUtil.set(`user:id:${user.user_id}`, user);
      await RedisUtil.set(`user:email:${user.email}`, user);
      
      return user;
      
    } catch (error) {
      await connection.rollback();
      
      // Check for duplicate email
      if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
        throw new Error('duplicate_email: Email already exists');
      }
      
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Delete user
   * @param {String} userId - User SSN
   * @returns {Boolean} Success status
   */
  async deleteUser(userId) {
    const connection = await pool.getConnection();
    
    try {
      // Get user email before deletion (for cache invalidation)
      const [rows] = await connection.query(
        'SELECT email FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        throw new Error('user_not_found: User does not exist');
      }
      
      const userEmail = rows[0].email;
      
      // Delete user
      const [result] = await connection.query(
        'DELETE FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('user_not_found: User does not exist');
      }
      
      // Invalidate caches
      await RedisUtil.del(`user:id:${userId}`);
      await RedisUtil.del(`user:email:${userEmail}`);
      
      return true;
      
    } finally {
      connection.release();
    }
  },

  /**
   * Verify user password (for login)
   * @param {String} email - User email
   * @param {String} password - Plain text password
   * @returns {Object|null} User object if password correct, null otherwise
   */
  async verifyPassword(email, password) {
    const normalizedEmail = email.toLowerCase();
    
    // Get user with password hash
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const user = rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // Return user without password
    delete user.password;
    return user;
  },

  /**
   * Get all users (for admin/testing - no caching)
   * @param {Number} limit - Max number of users to return
   * @param {Number} offset - Offset for pagination
   * @returns {Array} Array of users
   */
  async getAllUsers(limit = 100, offset = 0) {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, city, state, created_at FROM users LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return rows;
  },

  /**
   * Count total users (for statistics)
   * @returns {Number} Total user count
   */
  async getUserCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }
};

module.exports = UserModel;