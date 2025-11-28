/**
 * Create required Kafka topics on the managed broker.
 * Env:
 *  - KAFKA_BROKER (host:port)
 *  - KAFKA_SSL_CA_PATH, KAFKA_SSL_CERT_PATH, KAFKA_SSL_KEY_PATH (optional for mTLS)
 *  - KAFKA_SASL_USERNAME, KAFKA_SASL_PASSWORD, KAFKA_SASL_MECHANISM (optional)
 */
const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env or root .env if present
['../backend/.env', '../.env'].forEach((relPath) => {
  const full = path.resolve(__dirname, relPath);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
  }
});

const broker = process.env.KAFKA_BROKER;
if (!broker) {
  console.error('KAFKA_BROKER is required');
  process.exit(1);
}

const sslEnabled =
  process.env.KAFKA_SSL_CA_PATH ||
  process.env.KAFKA_SSL_CERT_PATH ||
  process.env.KAFKA_SSL_KEY_PATH;

const resolvePath = (p) => (p && !path.isAbsolute(p) ? path.resolve(__dirname, '..', p) : p);

const ssl = sslEnabled
  ? {
      rejectUnauthorized: true,
      ca: process.env.KAFKA_SSL_CA_PATH ? [fs.readFileSync(resolvePath(process.env.KAFKA_SSL_CA_PATH), 'utf-8')] : undefined,
      cert: process.env.KAFKA_SSL_CERT_PATH ? fs.readFileSync(resolvePath(process.env.KAFKA_SSL_CERT_PATH), 'utf-8') : undefined,
      key: process.env.KAFKA_SSL_KEY_PATH ? fs.readFileSync(resolvePath(process.env.KAFKA_SSL_KEY_PATH), 'utf-8') : undefined,
    }
  : undefined;

const sasl = process.env.KAFKA_SASL_USERNAME
  ? {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD || '',
    }
  : undefined;

const kafka = new Kafka({
  clientId: 'topic-seeder',
  brokers: [broker],
  ssl,
  sasl,
});

const topics = [
  { topic: 'booking.created', numPartitions: 3, replicationFactor: 1 },
  { topic: 'payment.processed', numPartitions: 3, replicationFactor: 1 },
  { topic: 'payment.failed', numPartitions: 3, replicationFactor: 1 },
];

async function main() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics,
    waitForLeaders: true,
  });
  console.log('✅ Topics ensured:', topics.map((t) => t.topic).join(', '));
  await admin.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Kafka topic creation failed:', err);
  process.exit(1);
});
