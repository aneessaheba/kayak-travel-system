/**
 * Simple Redis connectivity check and optional priming.
 * Env: REDIS_URL (required).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('redis');

// Load env from backend/.env or root .env if present
['../backend/.env', '../.env'].forEach((relPath) => {
  const full = path.resolve(__dirname, relPath);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
  }
});

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('REDIS_URL is required');
  process.exit(1);
}

async function main() {
  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis Client Error', err));
  await client.connect();
  await client.set('kayak:seed:timestamp', new Date().toISOString());
  const pong = await client.ping();
  console.log('✅ Redis ping:', pong);
  await client.quit();
}

main().catch((err) => {
  console.error('❌ Redis seed failed:', err);
  process.exit(1);
});
