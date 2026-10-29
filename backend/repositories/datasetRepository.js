const { getDb } = require('../database/db');

function formatDatasetRecord(row) {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        filename: row.filename,
        filePath: row.file_path,
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

