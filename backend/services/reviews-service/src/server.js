const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations
const { connectMongoDB, closeMongoDB } = require('./config/mongodb.js');
const { connectRedis } = require('./config/redis.js');

// Import routes and middleware
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestLogger); // Log all requests

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reviews Service is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: 'Endpoint not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize connections and start server
async function startServer() {
  try {
    console.log('🚀 Starting Reviews Service...\n');
    
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectMongoDB();
    
    // Connect to Redis (shared with other services)
    console.log('💾 Connecting to Redis...');
    await connectRedis();
    
    console.log('\n✅ All connections established successfully!\n');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎉 Reviews Service running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API endpoints: http://localhost:${PORT}/api/reviews`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await closeMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await closeMongoDB();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;