const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let instance = null;

function getDb(customPath = null) {
    if (instance && !customPath) {
        return instance;
    }

    const dbPath = customPath || process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'analyst.db');
    
    // Ensure parent directory exists for file-based DBs
    if (dbPath !== ':memory:') {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    const db = new Database(dbPath);
    
    // Performance and safety pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');

    // Auto-apply migrations if schema is not yet initialized
    try {
        const hasSchema = db.prepare(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
        ).get();

        if (!hasSchema) {
            const { runMigrations } = require('./migrator');
            runMigrations(db);
        }
    } catch (migErr) {
        // Ignored if within nested migration check
    }

    if (!customPath) {
        instance = db;
    }

    return db;
}

function closeDb() {
    if (instance) {
        try {
            instance.close();
        } catch (e) {
            // Already closed
        }
        instance = null;
    }
}

module.exports = {
    getDb,
    closeDb
};
