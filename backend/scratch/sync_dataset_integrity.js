const fs = require('fs');
const path = require('path');
const { getDb } = require('../database/db');
const { profileDataset } = require('../services/schemaProfiler');
const db = getDb();

console.log('=== RUNNING COMPREHENSIVE DATASET INTEGRITY & PROFILING SYNC ===');

const datasets = db.prepare('SELECT id, filename, file_path FROM datasets').all();

for (const d of datasets) {
  let fullPath = d.file_path;
  if (!fs.existsSync(fullPath)) {
    fullPath = path.resolve('backend', d.file_path.replace(/^backend[\\/]/, ''));
  }
  if (!fs.existsSync(fullPath)) {
    fullPath = path.resolve('backend/data/datasets', path.basename(d.file_path));
  }

  if (!fs.existsSync(fullPath)) {
    console.warn(`Dataset ${d.filename} (${d.id}) file not found at ${fullPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) {
    console.warn(`Dataset ${d.filename} has no data rows`);
    continue;
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      const val = vals[idx];
      row[h] = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
    });
    return row;
  });

  const profile = profileDataset(rows, headers);

  console.log(`Profiled ${d.filename}: ${rows.length} rows, ${headers.length} columns, Completeness: ${profile.dataQuality?.completenessRate}`);

  db.prepare(`
    UPDATE datasets 
    SET row_count = ?, column_count = ?, columns_json = ?, schema_json = ?,
        data_quality_json = ?, data_preview_json = ?, updated_at = ?
    WHERE id = ?
  `).run(
    rows.length,
    headers.length,
    JSON.stringify(profile.columns),
    JSON.stringify(profile.schema),
    JSON.stringify(profile.dataQuality),
    JSON.stringify(rows),
    new Date().toISOString(),
    d.id
  );
}

console.log('--- ALL DATASETS SYNCED AND PROFILED SUCCESSFULLY ---');
const updated = db.prepare('SELECT id, filename, row_count, column_count FROM datasets').all();
console.table(updated);
