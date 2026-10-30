const { getDb } = require('../database/db');
const db = getDb();

console.log('--- TABLES IN analyst.db ---');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

console.log('\n--- DATASETS ---');
const datasets = db.prepare('SELECT id, filename, row_count, column_count, file_path, user_id, created_at FROM datasets').all();
console.table(datasets);

console.log('\n--- CONVERSATIONS ---');
const conversations = db.prepare('SELECT id, title, dataset_id, user_id, created_at, updated_at FROM conversations').all();
console.table(conversations);

console.log('\n--- MESSAGES ---');
const messages = db.prepare('SELECT id, conversation_id, role, substr(content, 1, 60) as snippet, created_at FROM messages').all();
console.table(messages);

