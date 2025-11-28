/**
 * Seed MongoDB: create databases/collections and basic indexes.
 * Uses MONGODB_URI as base; if no DB name present, appends per-service DB names.
 *
 * Env:
 *  - MONGODB_URI (required, may include credentials)
 *  - MONGODB_DB (optional for agent db; defaults to agent_db)
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load env from backend/.env or root .env if present
['../backend/.env', '../.env'].forEach((relPath) => {
  const full = path.resolve(__dirname, relPath);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
  }
});

const BASE_URI = process.env.MONGODB_URI;
const AGENT_DB = process.env.MONGODB_DB || 'agent_db';

if (!BASE_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const serviceDbs = [
  'kayak_users',
  'kayak_flights',
  'kayak_hotels',
  'kayak_cars',
  'kayak_billing',
  'kayak_admin',
  AGENT_DB,
];

const appendDb = (uri, dbName) => {
  try {
    const u = new URL(uri);
    // If a pathname already exists and is not root, keep it
    if (u.pathname && u.pathname !== '/' && u.pathname !== '') {
      return uri;
    }
    u.pathname = `/${dbName}`;
    return u.toString();
  } catch (err) {
    console.error('Invalid MONGODB_URI:', err.message);
    process.exit(1);
  }
};

const indexSpecs = {
  kayak_users: [{ key: { email: 1 }, unique: true }, { key: { userId: 1 }, unique: true }],
  kayak_flights: [{ key: { flightId: 1 }, unique: true }],
  kayak_hotels: [{ key: { hotelId: 1 }, unique: true }],
  kayak_cars: [{ key: { carId: 1 }, unique: true }],
  kayak_billing: [{ key: { billing_id: 1 }, unique: true }, { key: { booking_id: 1 } }],
  kayak_admin: [{ key: { email: 1 }, unique: true }],
};

const agentIndexes = [{ key: { deal_uid: 1 }, unique: true }, { key: { kind: 1 } }];

async function seedDb(dbName) {
  const uri = appendDb(BASE_URI, dbName);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collectionName =
      dbName === AGENT_DB ? 'deals' : dbName.replace('kayak_', '').replace('_', '') || 'items';
    const collection = db.collection(collectionName);
    const specs = dbName === AGENT_DB ? agentIndexes : indexSpecs[dbName] || [];
    for (const spec of specs) {
      await collection.createIndex(spec.key, { unique: spec.unique || false });
    }
    console.log(`✅ Seeded DB ${dbName} (${collectionName})`);
  } catch (err) {
    console.error(`❌ Failed to seed DB ${dbName}:`, err.message);
  } finally {
    await client.close();
  }
}

async function main() {
  for (const db of serviceDbs) {
    await seedDb(db);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
