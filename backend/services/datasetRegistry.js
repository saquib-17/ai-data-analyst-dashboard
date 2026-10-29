/**
 * Persistent Dataset Registry
 * Backed by SQLite (better-sqlite3) and durable filesystem storage.
 * Manages dataset identification, scoping, schema metadata, and lifecycle.
 * Reconstructs DuckDB analytical tables automatically on-demand after backend restarts.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { profileDataset } = require('./schemaProfiler');
const { 
    loadDatasetToDuckDB, 
    dropDatasetFromDuckDB, 
    tableExistsInDuckDB 
} = require('./analyticalEngine');
const { datasetRepository } = require('../repositories/datasetRepository');

// Durable storage directory for uploaded dataset files
const DATASETS_STORAGE_DIR = path.resolve(__dirname, '..', 'data', 'datasets');
if (!fs.existsSync(DATASETS_STORAGE_DIR)) {
    fs.mkdirSync(DATASETS_STORAGE_DIR, { recursive: true });
}

// In-memory cache for fast lookup during active session: Map<datasetId, DatasetRecord>
const memoryCache = new Map();
let lastActiveDatasetId = null;

/**
 * Ensures durable CSV file exists on disk.
 * Either copies from temp upload path, or writes from rows array.
 */
function persistCsvFile(datasetId, sourcePath, rows, columns) {
    const targetPath = path.join(DATASETS_STORAGE_DIR, `${datasetId}.csv`);

    if (sourcePath && fs.existsSync(sourcePath)) {
        try {
            fs.copyFileSync(sourcePath, targetPath);
            return targetPath;
        } catch (copyErr) {
            console.warn(`[DatasetRegistry] Could not copy file from ${sourcePath}, writing from rows:`, copyErr.message);
        }
    }

    if (Array.isArray(rows) && rows.length > 0) {
        const headers = columns && columns.length > 0 ? columns : Object.keys(rows[0]);
        let csvContent = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';
        for (const row of rows) {
            const line = headers.map(h => {
                const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                return `"${val.replace(/"/g, '""')}"`;
            }).join(',');
            csvContent += line + '\n';
        }
        fs.writeFileSync(targetPath, csvContent, 'utf8');
        return targetPath;
    }

    return targetPath;
}

/**
 * Registers a newly uploaded dataset.
 * Runs schema profiling, saves CSV durably, provisions DuckDB table, and persists to SQLite.
 */
async function registerDataset({ filename, rows, rawHeaders = null, filePath = null, userId = 'local-user' }) {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Cannot register an empty dataset.");
    }

    const datasetId = crypto.randomUUID();
    const tableName = `dataset_${datasetId.replace(/-/g, '_')}`;

    // 1. Profile schema and detect data types
    const profile = profileDataset(rows, rawHeaders);
    if (!profile.isValid) {
        throw new Error(profile.error || "Dataset profiling failed.");
    }

    // 2. Persist CSV file durably so it survives restarts
    const durableFilePath = persistCsvFile(datasetId, filePath, rows, profile.columns);

    // 3. Provision analytical table in DuckDB
    try {
        await loadDatasetToDuckDB({
            tableName,
            rows,
            filePath: durableFilePath,
            columns: profile.columns,
            columnMapping: profile.columnMapping
        });
    } catch (duckErr) {
        console.warn(`[AnalyticalEngine Warning] Could not load ${tableName} into DuckDB:`, duckErr.message);
    }

    // 4. Persist dataset metadata into SQLite database
    const record = {
        id: datasetId,
        userId: userId || 'local-user',
        filename: filename || `dataset_${datasetId.slice(0, 8)}.csv`,
        filePath: durableFilePath,
        tableName,
        uploadedAt: new Date().toISOString(),
        rowCount: rows.length,
        columnCount: profile.columnCount,
        columns: profile.columns,
        columnMapping: profile.columnMapping,
        schema: profile.schema,
        dataQuality: profile.dataQuality,
        // First 100 rows preview
        data: rows.slice(0, 100),
        // Keep in-memory full rows for instant JS fallback
        rawRows: rows
    };

    datasetRepository.createDataset(record);

    memoryCache.set(datasetId, record);
    lastActiveDatasetId = datasetId;

    return record;
}

/**
 * Retrieves a dataset by its unique ID.
 * If DuckDB table was lost (e.g. backend restarted), lazily reconstructs the table in DuckDB!
 */
async function getDatasetAsync(datasetId = null, userId = null) {
    let record = null;

    if (datasetId && typeof datasetId === 'string' && datasetId.trim()) {
        const id = datasetId.trim();
        record = memoryCache.get(id);

        if (!record) {
            record = datasetRepository.getDatasetById(id, userId);
            if (record) {
                memoryCache.set(id, record);
            }
        }
    } else {
        // Fallback resolution when datasetId is omitted
        if (memoryCache.size === 1) {
            record = memoryCache.values().next().value;
        } else if (lastActiveDatasetId && memoryCache.has(lastActiveDatasetId)) {
            record = memoryCache.get(lastActiveDatasetId);
        } else {
            const allDatasets = datasetRepository.listDatasets(userId);
            if (allDatasets.length === 1) {
                record = allDatasets[0];
            }
        }
    }

    if (!record) return null;

    // Ensure DuckDB table exists; if process restarted, reconstruct from durable CSV
    try {
        const exists = await tableExistsInDuckDB(record.tableName);
        if (!exists && fs.existsSync(record.filePath)) {
            await loadDatasetToDuckDB({
                tableName: record.tableName,
                filePath: record.filePath,
                columns: record.columns
            });
        }
    } catch (reconstructErr) {
        console.warn(`[DatasetRegistry] Failed to verify/reconstruct DuckDB table ${record.tableName}:`, reconstructErr.message);
    }

    return record;
}

/**
 * Synchronous getDataset for backward compatibility where callers don't await.
 */
function getDataset(datasetId = null, userId = null) {
    let record = null;

    if (datasetId && typeof datasetId === 'string' && datasetId.trim()) {
        const id = datasetId.trim();
        record = memoryCache.get(id);

        if (!record) {
            record = datasetRepository.getDatasetById(id, userId);
            if (record) {
                memoryCache.set(id, record);
            }
        }
    } else {
        if (memoryCache.size === 1) {
            record = memoryCache.values().next().value;
        } else if (lastActiveDatasetId && memoryCache.has(lastActiveDatasetId)) {
            record = memoryCache.get(lastActiveDatasetId);
        } else {
            const allDatasets = datasetRepository.listDatasets(userId);
            if (allDatasets.length === 1) {
                record = allDatasets[0];
            }
        }
    }

    return record;
}

/**
 * Returns metadata summaries for all currently loaded datasets from SQLite database.
 */
function listDatasets(userId = null) {
    return datasetRepository.listDatasets(userId);
}

async function unlinkWithRetry(filePath, maxRetries = 8, delayMs = 60) {
    if (!filePath || !fs.existsSync(filePath)) return true;
    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch (err) {
            if (err.code === 'EBUSY' && i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, delayMs));
            } else if (err.code !== 'EBUSY') {
                throw err;
            }
        }
    }
    return !fs.existsSync(filePath);
}

/**
 * Releases and unregisters a dataset, drops its DuckDB table, and deletes its durable CSV file.
 */
async function releaseDataset(datasetId, userId = null) {
    if (!datasetId || typeof datasetId !== 'string') return false;

    const id = datasetId.trim();
    const record = datasetRepository.getDatasetById(id, userId) || memoryCache.get(id);
    if (!record) return false;

    // 1. Drop DuckDB table
    try {
        await dropDatasetFromDuckDB(record.tableName);
    } catch (e) {
        console.warn(`[AnalyticalEngine Warning] Could not drop table ${record.tableName}:`, e.message);
    }

    // 2. Delete durable CSV file from disk (with Windows EBUSY retry)
    if (record.filePath && fs.existsSync(record.filePath)) {
        try {
            await unlinkWithRetry(record.filePath);
        } catch (unlinkErr) {
            console.warn(`[DatasetRegistry] Could not delete durable CSV file ${record.filePath}:`, unlinkErr.message);
        }
    }

    // 3. Delete from SQLite database
    datasetRepository.deleteDataset(id, userId);

    // 4. Clear from memory cache
    memoryCache.delete(id);
    if (lastActiveDatasetId === id) {
        lastActiveDatasetId = memoryCache.size > 0 ? memoryCache.keys().next().value : null;
    }

    return true;
}

/**
 * Clears all datasets from database, disk, and memory (used for test teardown).
 */
async function clearAllDatasets(userId = null) {
    const list = datasetRepository.listDatasets(userId);
    for (const d of list) {
        await releaseDataset(d.id, userId);
    }
    memoryCache.clear();
    lastActiveDatasetId = null;
}

module.exports = {
    registerDataset,
    getDataset,
    getDatasetAsync,
    listDatasets,
    releaseDataset,
    clearAllDatasets,
    getRegistrySize: () => datasetRepository.countDatasets()
};
