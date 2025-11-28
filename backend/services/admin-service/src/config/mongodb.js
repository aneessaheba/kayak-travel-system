const { MongoClient } = require('mongodb');
const config = require('../config/config');

let client = null;
let adminDB = null;
let flightsDB = null;
let hotelsDB = null;
let carsDB = null;

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    if (client) {
      console.log('⚠️  MongoDB already connected');
      return;
    }

    client = new MongoClient(config.mongodb.uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();

    // Get references to all databases
    adminDB = client.db(config.mongodb.databases.admin);
    flightsDB = client.db(config.mongodb.databases.flights);
    hotelsDB = client.db(config.mongodb.databases.hotels);
    carsDB = client.db(config.mongodb.databases.cars);

    console.log('✅ MongoDB connected successfully');
    console.log(`   - ${config.mongodb.databases.admin} (admins)`);
    console.log(`   - ${config.mongodb.databases.flights} (flights)`);
    console.log(`   - ${config.mongodb.databases.hotels} (hotels)`);
    console.log(`   - ${config.mongodb.databases.cars} (cars)`);

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Close MongoDB connection
const closeMongoDB = async () => {
  try {
    if (client) {
      await client.close();
      client = null;
      adminDB = null;
      flightsDB = null;
      hotelsDB = null;
      carsDB = null;
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
};

// Get database references
const getAdminDB = () => {
  if (!adminDB) throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  return adminDB;
};

const getFlightsDB = () => {
  if (!flightsDB) throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  return flightsDB;
};

const getHotelsDB = () => {
  if (!hotelsDB) throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  return hotelsDB;
};

const getCarsDB = () => {
  if (!carsDB) throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  return carsDB;
};

// Get collection helper
const getCollection = (dbName, collectionName) => {
  let db;
  switch (dbName) {
    case 'admin':
      db = getAdminDB();
      break;
    case 'flights':
      db = getFlightsDB();
      break;
    case 'hotels':
      db = getHotelsDB();
      break;
    case 'cars':
      db = getCarsDB();
      break;
    default:
      throw new Error(`Unknown database: ${dbName}`);
  }
  return db.collection(collectionName);
};

module.exports = {
  connectMongoDB,
  closeMongoDB,
  getAdminDB,
  getFlightsDB,
  getHotelsDB,
  getCarsDB,
  getCollection
};