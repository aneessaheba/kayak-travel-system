const express = require('express');
const cors = require('cors');
require('dotenv').config();

const billingRoutes = require('./routes/billingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');  // Add this
const { connectProducer, disconnectProducer } = require('./config/kafka');
const { startConsumer, disconnectConsumer } = require('./consumers/bookingConsumer');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/billing', billingRoutes);
app.use('/api/bookings', bookingRoutes);  // Add this

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'booking-billing-service',
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    await connectProducer();
    await startConsumer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Booking & Billing Service running on port ${PORT}`);
      console.log(`📡 Listening for Kafka events...`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

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