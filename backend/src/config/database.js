// Elite Fitness - Database Configuration & Connection Pool
const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

async function testConnection() {
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('SELECT NOW()');
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const db = getPool();
  const start = Date.now();
  try {
    const result = await db.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (error) {
    logger.error(`Query error: ${error.message}`, { query: text.substring(0, 200) });
    throw error;
  }
}

async function getClient() {
  const db = getPool();
  return db.connect();
}

// Transaction helper
async function withTransaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { query, getClient, withTransaction, testConnection, getPool };
