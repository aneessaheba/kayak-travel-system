const express = require('express');
const cors = require('cors');
require('dotenv').config();

const billingRoutes = require('./routes/billingRoutes');
const { connectProducer, disconnectProducer } = require('./config/kafka');
const { startConsumer, disconnectConsumer } = require('./consumers/consumer');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/billing', billingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'billing-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect Kafka producer
    await connectProducer();
    
    // Start Kafka consumer
    await startConsumer();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Billing Service running on port ${PORT}`);
      console.log(`📡 Listening for Kafka events...`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  process.exit(0);
});

module.exports = app;