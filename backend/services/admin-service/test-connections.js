// Test database connections
require('dotenv').config();
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

console.log('\n🧪 Testing Database Connections...\n');

async function testConnections() {
  let allPassed = true;

  // Test MySQL
  console.log('1️⃣  Testing MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'kayak_db'
    });
    await connection.execute('SELECT 1');
    console.log('   ✅ MySQL connected\n');
    await connection.end();
  } catch (error) {
    console.log('   ❌ MySQL failed:', error.message, '\n');
    allPassed = false;
  }

  // Test MongoDB
  console.log('2️⃣  Testing MongoDB...');
  try {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    await client.connect();
    await client.db('kayak_admin').command({ ping: 1 });
    console.log('   ✅ MongoDB connected\n');
    await client.close();
  } catch (error) {
    console.log('   ❌ MongoDB failed:', error.message, '\n');
    allPassed = false;
  }

  // Test Redis
  console.log('3️⃣  Testing Redis...');
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: () => null
    });
    await redis.ping();
    console.log('   ✅ Redis connected\n');
    await redis.quit();
  } catch (error) {
    console.log('   ❌ Redis failed:', error.message, '\n');
    allPassed = false;
  }

  if (allPassed) {
    console.log('✅ All connections successful! Ready to start.\n');
  } else {
    console.log('❌ Some connections failed. Please check your configuration.\n');
    process.exit(1);
  }
}

testConnections();