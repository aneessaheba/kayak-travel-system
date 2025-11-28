const { Kafka } = require('kafkajs');
const config = require('../config/config');
const { getCollection } = require('./mongodb');

let kafka = null;
let consumer = null;
let isConnected = false;

// Initialize Kafka
const initKafka = () => {
  try {
    kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    consumer = kafka.consumer({ 
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    console.log('✅ Kafka initialized');
    return true;
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error.message);
    return false;
  }
};

// Connect Kafka consumer
const connectKafka = async () => {
  try {
    if (isConnected) {
      console.log('⚠️  Kafka consumer already connected');
      return true;
    }

    if (!consumer) {
      initKafka();
    }

    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    // Subscribe to topics
    await consumer.subscribe({ 
      topic: config.kafka.topics.logs, 
      fromBeginning: false 
    });
    console.log(`✅ Subscribed to topic: ${config.kafka.topics.logs}`);

    isConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Kafka connection failed:', error.message);
    isConnected = false;
    return false;
  }
};

// Start consuming messages
const startConsuming = async () => {
  try {
    if (!isConnected) {
      await connectKafka();
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const logData = JSON.parse(message.value.toString());
          
          // Store log in MongoDB
          await storeActivityLog(logData);

          console.log(`📊 Activity log processed: ${logData.eventType}`);
        } catch (error) {
          console.error('Error processing Kafka message:', error.message);
        }
      },
    });

    console.log('✅ Kafka consumer started');
  } catch (error) {
    console.error('Error starting Kafka consumer:', error.message);
    throw error;
  }
};

// Store activity log in MongoDB
const storeActivityLog = async (logData) => {
  try {
    const logsCollection = getCollection('admin', 'activity_logs');
    
    const log = {
      ...logData,
      timestamp: new Date(),
      createdAt: new Date()
    };

    await logsCollection.insertOne(log);
  } catch (error) {
    console.error('Error storing activity log:', error.message);
    // Don't throw - we don't want to stop message consumption
  }
};

// Disconnect Kafka consumer
const disconnectKafka = async () => {
  try {
    if (consumer && isConnected) {
      await consumer.disconnect();
      isConnected = false;
      console.log('Kafka consumer disconnected');
    }
  } catch (error) {
    console.error('Error disconnecting Kafka:', error.message);
  }
};

module.exports = {
  initKafka,
  connectKafka,
  startConsuming,
  disconnectKafka,
  isConnected: () => isConnected
};