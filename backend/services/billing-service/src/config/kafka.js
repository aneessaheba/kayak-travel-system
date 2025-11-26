const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected');
  } catch (error) {
    console.error('❌ Kafka connection failed:', error.message);
  }
};

const publishEvent = async (topic, message) => {
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
    console.log(`📤 Published to ${topic}:`, message);
  } catch (error) {
    console.error('❌ Kafka publish failed:', error.message);
  }
};

const disconnectProducer = async () => {
  await producer.disconnect();
  console.log('Kafka producer disconnected');
};

module.exports = {
  connectProducer,
  publishEvent,
  disconnectProducer
};