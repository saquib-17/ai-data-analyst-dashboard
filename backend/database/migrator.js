const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

function runMigrations(db = null) {
    const database = db || getDb();

    // Ensure schema_migrations table exists
    database.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        return [];
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const appliedVersions = new Set(
        database.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
    );

    const newlyApplied = [];

    for (const file of files) {
        if (!appliedVersions.has(file)) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            database.transaction(() => {
                database.exec(sql);
                database.prepare(
                    'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)'
                ).run(file, new Date().toISOString());
            })();

            newlyApplied.push(file);
        }
    }

    return newlyApplied;
}

module.exports = {
    runMigrations
};

