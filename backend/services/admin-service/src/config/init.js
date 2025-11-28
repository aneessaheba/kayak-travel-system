const mysqlDB = require('./mysql');
const { connectMongoDB } = require('./mongodb');
const { connectRedis } = require('./redis');
const { connectKafka, startConsuming } = require('./kafka');

// Initialize all database connections
const initializeConnections = async () => {
  console.log('\n🚀 Initializing Admin Service connections...\n');

  try {
    // 1. Test MySQL connection
    console.log('1️⃣  Connecting to MySQL...');
    await mysqlDB.testConnection();

    // 2. Connect to MongoDB
    console.log('\n2️⃣  Connecting to MongoDB...');
    await connectMongoDB();

    // 3. Connect to Redis
    console.log('\n3️⃣  Connecting to Redis...');
    connectRedis();

    // 4. Kafka is OPTIONAL - Skip for now
    // console.log('\n4️⃣  Connecting to Kafka...');
    // Uncomment below if you want to enable Kafka user activity tracking
    /*
    try {
      await connectKafka();
      startConsuming().catch(err => {
        console.error('Kafka consumer error:', err.message);
      });
    } catch (error) {
      console.warn('⚠️  Kafka connection failed. Service will run without activity tracking.');
    }
    */
    console.log('\n4️⃣  Kafka: Skipped (not needed for core analytics)');

    console.log('\n✅ All connections initialized successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to initialize connections:', error.message);
    throw error;
  }
};

// Graceful shutdown
const closeConnections = async () => {
  console.log('\n🛑 Closing all connections...');

  const { closeMongoDB } = require('./mongodb');
  const { closeRedis } = require('./redis');
  const { disconnectKafka } = require('./kafka');

  try {
    await closeMongoDB();
    await closeRedis();
    await disconnectKafka();
    
    console.log('✅ All connections closed gracefully\n');
  } catch (error) {
    console.error('Error during shutdown:', error.message);
  }
};

module.exports = {
  initializeConnections,
  closeConnections
};