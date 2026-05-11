const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/tienda.db');

let _raw = null;

const db = {
  async: {
    query: null,
    getConnection: null
  },
  saveDB: null,
  raw: null
};

function saveDB() {
  const data = _raw.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function _execute(sql, params = [], autoSave = true) {
  const trimmed = sql.trim().toUpperCase();
  const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA');

  if (isSelect) {
    const stmt = _raw.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows];
  } else {
    _raw.run(sql, params);
    const changes = _raw.getRowsModified();
    let lastId = null;
    try {
      const result = _raw.exec("SELECT last_insert_rowid() as id");
      if (result.length > 0 && result[0].values.length > 0) {
        lastId = result[0].values[0][0];
      }
    } catch (e) { /* ignore */ }
    if (autoSave) saveDB();
    return [{ affectedRows: changes, insertId: lastId }];
  }
}

async function asyncQuery(sql, params = []) {
  return _execute(sql, params, true);
}

async function getConnection() {
  return {
    async query(sql, params = []) {
      return _execute(sql, params, false);
    },
    async beginTransaction() {
      _raw.exec('BEGIN');
    },
    async commit() {
      _raw.exec('COMMIT');
      saveDB();
    },
    async rollback() {
      try { _raw.exec('ROLLBACK'); } catch (e) { /* no active transaction */ }
    },
    release() {}
  };
}

async function initDatabase() {
  const SQL = await initSqlJs();

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _raw = new SQL.Database(buffer);
  } else {
    _raw = new SQL.Database();
  }

  db.async.query = asyncQuery;
  db.async.getConnection = getConnection;
  db.saveDB = saveDB;
  db.raw = _raw;

  return db;
}

module.exports = { db, initDatabase };
