require('dotenv').config();

module.exports = {
  // Server Config
  server: {
    port: process.env.PORT || 3004,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT Config
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // MySQL Config
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'kayak_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  // MongoDB Config
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    databases: {
      admin: process.env.MONGO_ADMIN_DB || 'kayak_admin',
      flights: process.env.MONGO_FLIGHTS_DB || 'kayak_flights',
      hotels: process.env.MONGO_HOTELS_DB || 'kayak_hotels',
      cars: process.env.MONGO_CARS_DB || 'kayak_cars'
    }
  },

  // Redis Config
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    cacheTTL: parseInt(process.env.CACHE_TTL) || 300 // 5 minutes
  },

  // Kafka Config
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'admin-service',
    groupId: process.env.KAFKA_GROUP_ID || 'admin-service-group',
    topics: {
      logs: process.env.KAFKA_LOGS_TOPIC || 'user-activity-logs'
    }
  },

  // CORS Config
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
};