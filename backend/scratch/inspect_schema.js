const { getDb } = require('../database/db');
const db = getDb();
const row = db.prepare("SELECT filename, schema_json FROM datasets WHERE filename = 'sales_data_2024.csv'").get();
console.log(row.filename, 'Schema:');
console.log(JSON.parse(row.schema_json));

