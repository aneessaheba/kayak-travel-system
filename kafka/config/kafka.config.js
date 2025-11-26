module.exports = {
  clientId: 'kayak-client',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  connectionTimeout: 3000,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};

