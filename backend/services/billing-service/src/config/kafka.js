const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],  // Add fallback
  connectionTimeout: 10000,
  requestTimeout: 30000
});

const producer = kafka.producer();
let isProducerConnected = false;

const connectProducer = async () => {
  try {
    console.log('Connecting to Kafka producer...');
    await producer.connect();
    isProducerConnected = true;
    console.log('✅ Kafka producer connected');
  } catch (error) {
    console.error('❌ Kafka producer connection failed:', error.message);
    console.log('⚠️  Service will continue without Kafka producer');
    isProducerConnected = false;
  }
};

const publishEvent = async (topic, message) => {
  if (!isProducerConnected) {
    console.log('⚠️  Kafka producer not connected - skipping event publish');
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: message.billing_id || message.user_id,
          value: JSON.stringify(message)
        }
      ]
    });
    console.log(`📤 Published to ${topic}`);
  } catch (error) {
    console.error('❌ Kafka publish failed:', error.message);
  }
};

const disconnectProducer = async () => {
  if (isProducerConnected) {
    try {
      await producer.disconnect();
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Error disconnecting producer:', error.message);
    }
  }
};

module.exports = {
  connectProducer,
  publishEvent,
  disconnectProducer
};