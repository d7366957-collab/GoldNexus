const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error abriendo DB:', err.message);
    else console.log('Conectado a SQLite.');
});

db.serialize(() => {
    // Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        balance REAL DEFAULT 0,
        referidos INTEGER DEFAULT 0,
        referidor_id INTEGER,
        language TEXT DEFAULT 'es',
        wallet TEXT,
        banned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tareas (Canales)
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        link TEXT,
        reward REAL,
        active INTEGER DEFAULT 1
    )`);

    // Tareas completadas
    db.run(`CREATE TABLE IF NOT EXISTS completed_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        task_id INTEGER,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_id)
    )`);

    // Retiros
    db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        wallet TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
    )`);

    // Check-in
    db.run(`CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        UNIQUE(user_id, date)
    )`);
});

module.exports = db;
