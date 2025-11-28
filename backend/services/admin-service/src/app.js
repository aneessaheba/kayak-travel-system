const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config/config');
const { initializeConnections, closeConnections } = require('./config/init');

// Import routes
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (only in development)
if (config.server.env === 'development') {
  app.use(morgan('dev'));
}

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Service is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.server.env === 'development' && { stack: err.stack })
  });
});

// ==================== SERVER STARTUP ====================

const startServer = async () => {
  try {
    // Initialize all database connections
    await initializeConnections();

    // Start Express server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Admin Service running on port ${PORT}`);
      console.log(`📊 Environment: ${config.server.env}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('='.repeat(60) + '\n');
      
      console.log('📌 Available Endpoints:');
      console.log('   Health Check: GET /health');
      console.log('   Auth:         POST /api/auth/login');
      console.log('   Profile:      GET /api/auth/profile');
      console.log('   Analytics:    GET /api/analytics/overview');
      console.log('   Top Props:    GET /api/analytics/top-properties?year=2025');
      console.log('   City Revenue: GET /api/analytics/city-revenue?year=2025');
      console.log('   Top Providers: GET /api/analytics/top-providers?type=flight');
      console.log('\n');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    await closeConnections();
    console.log('✅ Server shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

module.exports = app;