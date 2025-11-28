const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'kayak_reviews';

let db = null;
let client = null;

// Connect to MongoDB
async function connectMongoDB() {
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db(dbName);
    
    console.log('✓ MongoDB connected successfully');
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    throw error;
  }
}

// Create indexes for optimal performance
async function createIndexes() {
  try {
    const reviewsCollection = db.collection('reviews');
    
    // 1. Get all reviews for specific entity (most common query)
    await reviewsCollection.createIndex({ entity_type: 1, entity_id: 1 });
    
    // 2. Get all reviews by specific user
    await reviewsCollection.createIndex({ user_id: 1 });
    
    // 3. Prevent duplicate reviews (UNIQUE constraint)
    await reviewsCollection.createIndex(
      { entity_type: 1, entity_id: 1, user_id: 1 }, 
      { unique: true }
    );
    
    // 4. Query by creation date (for "recent reviews")
    await reviewsCollection.createIndex({ created_at: -1 });
    
    console.log('✓ MongoDB indexes created');
  } catch (error) {
    console.error('✗ Index creation error:', error.message);
  }
}

// Get database instance
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectMongoDB first.');
  }
  return db;
}

// Get collection
function getCollection(collectionName) {
  return getDB().collection(collectionName);
}

// Close connection (for graceful shutdown)
async function closeMongoDB() {
  try {
    if (client) {
      await client.close();
      console.log('✓ MongoDB connection closed');
    }
  } catch (error) {
    console.error('✗ MongoDB close error:', error.message);
  }
}

module.exports = {
  connectMongoDB,
  getDB,
  getCollection,
  closeMongoDB
};