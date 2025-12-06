const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.sqlite');

if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

const db = new sqlite3.Database(DB_FILE);

const initSql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
db.exec(initSql, (err) => {
  if (err) console.error('DB init error', err);
});

module.exports = db;
