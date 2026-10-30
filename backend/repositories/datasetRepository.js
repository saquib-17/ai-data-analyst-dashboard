const fs = require('fs');
const path = require('path');
const { getDb } = require('../database/db');

function resolvePath(filePath) {
    if (!filePath) return null;
    const candidates = [
        filePath,
        path.resolve(process.cwd(), filePath),
        path.resolve(__dirname, '..', filePath),
        path.resolve(__dirname, '..', 'data', 'datasets', path.basename(filePath)),
        path.resolve(process.cwd(), 'backend', 'data', 'datasets', path.basename(filePath))
    ];
    return candidates.find(p => fs.existsSync(p)) || null;
}

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function formatDatasetRecord(row) {
    if (!row) return null;

    const resolved = resolvePath(row.file_path);
    let fileSizeBytes = 0;
    if (resolved && fs.existsSync(resolved)) {
        try {
            fileSizeBytes = fs.statSync(resolved).size;
        } catch (_) {}
    }

    return {
        id: row.id,
        userId: row.user_id,
        filename: row.filename,
        filePath: resolved || row.file_path,
        fileSizeBytes,
        fileSize: formatBytes(fileSizeBytes),
        rowCount: row.row_count,
        columnCount: row.column_count,
        columns: JSON.parse(row.columns_json || '[]'),
        columnMapping: row.column_mapping_json ? JSON.parse(row.column_mapping_json) : [],
        schema: JSON.parse(row.schema_json || '{}'),
        dataQuality: row.data_quality_json ? JSON.parse(row.data_quality_json) : null,
        data: row.data_preview_json ? JSON.parse(row.data_preview_json) : [],
        status: row.status,
        createdAt: row.created_at,
        uploadedAt: row.created_at,
        updatedAt: row.updated_at,
        tableName: `dataset_${row.id.replace(/-/g, '_')}`
    };
}

class DatasetRepository {
    constructor(db = null) {
        this._customDb = db;
    }

    get db() {
        return this._customDb || getDb();
    }

    createDataset(record) {
        const stmt = this.db.prepare(`
            INSERT INTO datasets (
                id, user_id, filename, file_path, row_count, column_count,
                columns_json, column_mapping_json, schema_json,
                data_quality_json, data_preview_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = new Date().toISOString();
        const userId = record.userId || 'local-user';

        stmt.run(
            record.id,
            userId,
            record.filename,
            record.filePath,
            record.rowCount,
            record.columnCount,
            JSON.stringify(record.columns || []),
            JSON.stringify(record.columnMapping || []),
            JSON.stringify(record.schema || {}),
            JSON.stringify(record.dataQuality || null),
            JSON.stringify(record.data || []),
            record.status || 'active',
            record.createdAt || now,
            record.updatedAt || now
        );

        return this.getDatasetById(record.id, userId);
    }

    getDatasetById(datasetId, userId = null) {
        let query = 'SELECT * FROM datasets WHERE id = ?';
        const params = [datasetId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const row = this.db.prepare(query).get(...params);
        return formatDatasetRecord(row);
    }

    listDatasets(userId = null) {
        let query = "SELECT * FROM datasets WHERE status = 'active'";
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC';

        const rows = this.db.prepare(query).all(...params);
        return rows.map(formatDatasetRecord);
    }

    deleteDataset(datasetId, userId = null) {
        let query = 'DELETE FROM datasets WHERE id = ?';
        const params = [datasetId];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const info = this.db.prepare(query).run(...params);
        return info.changes > 0;
    }

    countDatasets(userId = null) {
        let query = "SELECT COUNT(*) as count FROM datasets WHERE status = 'active'";
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const result = this.db.prepare(query).get(...params);
        return result ? result.count : 0;
    }
}

module.exports = {
    DatasetRepository,
    datasetRepository: new DatasetRepository()
};

