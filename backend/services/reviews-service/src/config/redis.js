const redis = require('redis');
require('dotenv').config();

// Create Redis client (shared with other services on port 6379)
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES) || 3;
      if (retries > maxRetries) {
        console.error('✗ Redis max retries reached');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 1000, 3000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined
});

// Redis event handlers
redisClient.on('connect', () => {
  console.log('✓ Redis connecting...');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('✗ Redis error:', err.message);
});

redisClient.on('reconnecting', () => {
  console.log('⟳ Redis reconnecting...');
});

// Connect to Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('✓ Redis connected successfully');
  } catch (error) {
    console.error('✗ Redis connection failed:', error.message);
    throw error;
  }
}

// Redis utility functions
const RedisUtil = {
  // Get cached data
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  },

  // Set data with TTL
  async set(key, value, ttl = parseInt(process.env.REDIS_TTL) || 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  },

  // Delete cache
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DEL pattern error:', error.message);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error.message);
      return false;
    }
  }
};

module.exports = { redisClient, connectRedis, RedisUtil };