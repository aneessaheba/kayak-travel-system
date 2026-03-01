/**
 * monitor-bookings.js
 * Real-time Kafka topic monitor for booking and payment events.
 * Subscribes to booking.created, payment.processed, and payment.failed
 * and prints a formatted event log to the console.
 *
 * Usage:
 *   node kafka/monitor-bookings.js
 *   node kafka/monitor-bookings.js --topic booking.created
 *   node kafka/monitor-bookings.js --topic payment.processed --from beginning
 */

require('dotenv').config({ path: './backend/.env' });
const { Kafka } = require('kafkajs');
const fs = require('fs');

const args = process.argv.slice(2);
const topicArg = args[args.indexOf('--topic') + 1];
const fromArg  = args[args.indexOf('--from')  + 1];

const ALL_TOPICS = ['booking.created', 'payment.processed', 'payment.failed'];
const TOPICS     = topicArg ? [topicArg] : ALL_TOPICS;
const FROM_START = fromArg === 'beginning';

const BROKER  = process.env.KAFKA_BROKER;
const CA_PATH = process.env.KAFKA_SSL_CA_PATH;
const CERT    = process.env.KAFKA_SSL_CERT_PATH;
const KEY     = process.env.KAFKA_SSL_KEY_PATH;

if (!BROKER) {
  console.error('KAFKA_BROKER not set in backend/.env');
  process.exit(1);
}

const kafka = new Kafka({
  clientId: 'kayak-monitor',
  brokers: [BROKER],
  ssl: CA_PATH
    ? {
        ca:   [fs.readFileSync(CA_PATH)],
        cert: fs.readFileSync(CERT),
        key:  fs.readFileSync(KEY),
      }
    : undefined,
});

const COLOURS = {
  'booking.created':    '\x1b[34m',  // blue
  'payment.processed':  '\x1b[32m',  // green
  'payment.failed':     '\x1b[31m',  // red
  reset:                '\x1b[0m',
};

const COUNTERS = Object.fromEntries(ALL_TOPICS.map((t) => [t, 0]));

async function run() {
  const consumer = kafka.consumer({ groupId: `kayak-monitor-${Date.now()}` });

  await consumer.connect();
  console.log('\n=== Kayak Kafka Monitor ===');
  console.log(`Broker : ${BROKER}`);
  console.log(`Topics : ${TOPICS.join(', ')}`);
  console.log(`From   : ${FROM_START ? 'beginning' : 'latest'}`);
  console.log('===========================\n');

  for (const topic of TOPICS) {
    await consumer.subscribe({ topic, fromBeginning: FROM_START });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      COUNTERS[topic] = (COUNTERS[topic] || 0) + 1;
      const colour = COLOURS[topic] || '';

      let payload = message.value?.toString() || '';
      try {
        payload = JSON.stringify(JSON.parse(payload), null, 2);
      } catch {}

      const ts = new Date().toISOString();
      console.log(
        `${colour}[${ts}] TOPIC=${topic} PARTITION=${partition} OFFSET=${message.offset}${COLOURS.reset}`
      );
      console.log(payload);
      console.log('---');
    },
  });

  // Print summary on exit
  process.on('SIGINT', async () => {
    console.log('\n\n=== Summary ===');
    for (const [topic, count] of Object.entries(COUNTERS)) {
      console.log(`  ${topic}: ${count} messages`);
    }
    await consumer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Monitor failed:', err);
  process.exit(1);
});
