const { Kafka } = require('kafkajs');
const fs = require('fs');
require('dotenv').config();

const buildKafkaConfig = () => {
  const broker = process.env.KAFKA_BROKER || 'localhost:9092';
  const sslEnabled =
    process.env.KAFKA_SSL_CA_PATH ||
    process.env.KAFKA_SSL_CERT_PATH ||
    process.env.KAFKA_SSL_KEY_PATH;

  const ssl = sslEnabled
    ? {
        rejectUnauthorized: true,
        ca: process.env.KAFKA_SSL_CA_PATH
          ? [fs.readFileSync(process.env.KAFKA_SSL_CA_PATH, 'utf-8')]
          : undefined,
        cert: process.env.KAFKA_SSL_CERT_PATH
          ? fs.readFileSync(process.env.KAFKA_SSL_CERT_PATH, 'utf-8')
          : undefined,
        key: process.env.KAFKA_SSL_KEY_PATH
          ? fs.readFileSync(process.env.KAFKA_SSL_KEY_PATH, 'utf-8')
          : undefined,
      }
    : undefined;

  const sasl = process.env.KAFKA_SASL_USERNAME
    ? {
        mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD || '',
      }
    : undefined;

  return {
    clientId: 'billing-service',
    brokers: [broker],
    connectionTimeout: 10000,
    requestTimeout: 30000,
    ssl,
    sasl,
  };
};

const kafka = new Kafka(buildKafkaConfig());

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
  disconnectProducer,
  buildKafkaConfig
};
