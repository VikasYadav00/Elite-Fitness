// Elite Fitness - Unified Database Driver (PostgreSQL with SQLite Persistence Fallback)
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { initSqliteSchema } = require('./sqliteSchema');

let pool = null;
let sqliteDb = null;
let activeEngine = 'pg'; // 'pg' | 'sqlite'
let sqliteInitialized = false;

function getSqliteDb() {
  if (!sqliteDb) {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'elite_fitness.sqlite');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');

    if (!sqliteInitialized) {
      initSqliteSchema(sqliteDb);
      sqliteInitialized = true;
    }
  }
  return sqliteDb;
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/elite_fitness_db',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.warn('PostgreSQL idle client note:', err.message);
    });
  }
  return pool;
}

async function testConnection() {
  try {
    const p = getPool();
    const client = await p.connect();
    try {
      await client.query('SELECT NOW()');
      activeEngine = 'pg';
      logger.info('✅ Active Database Engine: PostgreSQL');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    activeEngine = 'sqlite';
    getSqliteDb();
    logger.info('✅ Active Database Engine: SQLite (Local Persistent Database: backend/data/elite_fitness.sqlite)');
    return true;
  }
}

// Transform PostgreSQL queries to SQLite compatibility
function transformSqlForSqlite(sql, params = []) {
  let s = sql;

  // Replace ILIKE with LIKE
  s = s.replace(/\bILIKE\b/gi, 'LIKE');

  // Auto-alias unaliased COUNT(*) in SELECT list to AS count
  s = s.replace(/\bSELECT\s+COUNT\(\*\)(?!\s+AS\s+[a-zA-Z0-9_]+)/gi, 'SELECT COUNT(*) AS count');

  // Replace NOW() with datetime('now')
  s = s.replace(/\bNOW\(\)/gi, "datetime('now')");

  // Replace CURRENT_DATE with date('now')
  s = s.replace(/\bCURRENT_DATE\b/gi, "date('now')");

  // Replace EXTRACT(MONTH FROM col) with CAST(strftime('%m', col) AS INTEGER)
  s = s.replace(/EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\)/gi, "CAST(strftime('%m', $1) AS INTEGER)");

  // Replace EXTRACT(YEAR FROM col) with CAST(strftime('%Y', col) AS INTEGER)
  s = s.replace(/EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");

  // Replace TO_CHAR(..., 'Mon') with formatted month name
  s = s.replace(/TO_CHAR\s*\([^,]+,\s*'Mon'\s*\)/gi, "strftime('%b', date('now'))");

  // Remove Postgres casts like ::text, ::date, ::integer
  s = s.replace(/::[a-zA-Z0-9_]+/g, '');

  // Handle INTERVAL in date arithmetic (e.g. date >= date('now', '-30 days'))
  s = s.replace(/date\s*\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, "date('now', '-$1 days')");
  s = s.replace(/date\s*\('now'\)\s*\+\s*INTERVAL\s*'(\d+)\s*days'/gi, "date('now', '+$1 days')");
  s = s.replace(/datetime\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*minutes'/gi, "datetime('now', '-$1 minutes')");

  // Convert $1, $2, ... parameter placeholders to ?
  s = s.replace(/\$\d+/g, '?');

  return s;
}

async function query(text, params = []) {
  if (activeEngine === 'pg') {
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
      // If PostgreSQL query fails due to connection drop, fallback to SQLite
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect ECONNREFUSED')) {
        activeEngine = 'sqlite';
        return querySqlite(text, params);
      }
      logger.error(`Query error: ${error.message}`, { query: text.substring(0, 200) });
      throw error;
    }
  } else {
    return querySqlite(text, params);
  }
}

function querySqlite(text, params = []) {
  const db = getSqliteDb();
  const transformed = transformSqlForSqlite(text, params);

  // Normalize parameters (Date objects to ISO string, undefined to null)
  const cleanParams = (params || []).map((p) => {
    if (p instanceof Date) return p.toISOString();
    if (p === undefined) return null;
    return p;
  });

  try {
    const isSelect = /^\s*SELECT\b/i.test(transformed);
    const hasReturning = /\bRETURNING\b/i.test(transformed);

    if (isSelect || hasReturning) {
      const stmt = db.prepare(transformed);
      let rows = stmt.all(...cleanParams);
      rows = rows.map(r => {
        if (r && r['COUNT(*)'] !== undefined && r.count === undefined) {
          r.count = r['COUNT(*)'];
        }
        return r;
      });
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(transformed);
      const info = stmt.run(...cleanParams);
      return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  } catch (err) {
    logger.error(`SQLite query error: ${err.message}`, { query: transformed.substring(0, 200) });
    throw err;
  }
}

async function getClient() {
  if (activeEngine === 'pg') {
    const db = getPool();
    return db.connect();
  }
  // SQLite client simulation
  return {
    query: async (text, params) => querySqlite(text, params),
    release: () => {},
  };
}

// Transaction helper
async function withTransaction(callback) {
  if (activeEngine === 'pg') {
    let client;
    try {
      client = await getPool().connect();
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (_) {}
      }
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect ECONNREFUSED')) {
        activeEngine = 'sqlite';
        return withSqliteTransaction(callback);
      }
      throw error;
    } finally {
      if (client) client.release();
    }
  } else {
    return withSqliteTransaction(callback);
  }
}

function withSqliteTransaction(callback) {
  const db = getSqliteDb();
  const client = {
    query: async (text, params) => querySqlite(text, params),
    release: () => {},
  };

  db.exec('BEGIN');
  try {
    const result = Promise.resolve(callback(client));
    if (result && typeof result.then === 'function') {
      return result
        .then((res) => {
          db.exec('COMMIT');
          return res;
        })
        .catch((err) => {
          db.exec('ROLLBACK');
          throw err;
        });
    }
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { query, getClient, withTransaction, testConnection, getPool, getActiveEngine: () => activeEngine };
