const Redis = require('ioredis');
const config = require('../config/config');

let redisClient = null;

// Create Redis client
const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    throw error;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

// Cache helper functions
const cacheHelpers = {
  // Get cached data
  get: async (key) => {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error.message);
      return null; // Return null on error, don't break the app
    }
  },

  // Set cache with TTL
  set: async (key, value, ttl = config.redis.cacheTTL) => {
    try {
      const client = getRedisClient();
      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error.message);
      return false;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  },

  // Delete multiple keys by pattern
  delPattern: async (pattern) => {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`Redis DEL pattern error for ${pattern}:`, error.message);
      return 0;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  },

  // Get TTL of a key
  ttl: async (key) => {
    try {
      const client = getRedisClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error.message);
      return -1;
    }
  },

  // Flush all cache (use with caution!)
  flushAll: async () => {
    try {
      const client = getRedisClient();
      await client.flushall();
      console.log('⚠️  Redis cache flushed');
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error.message);
      return false;
    }
  }
};

// Close Redis connection
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error.message);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  ...cacheHelpers
};