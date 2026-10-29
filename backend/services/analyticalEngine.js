/**
 * Analytical Query Engine
 * Powered by DuckDB with in-memory execution, strict SQL safety validation,
 * parameter sanitization, and automatic fallback to JavaScript data processing.
 */

const duckdb = require('duckdb');
const fs = require('fs');
const path = require('path');
const { processData, parseNumericValue } = require('./dataProcessor');

let db = null;
let conn = null;
let isDuckDBReady = false;

/**
 * Initialize DuckDB instance and analytical helper macros.
 */
function initDuckDB() {
    if (isDuckDBReady && conn) return conn;

    try {
        db = new duckdb.Database(':memory:');
        conn = db.connect();

        // Macro to safely parse numbers with currency, commas, negative formats, and percentages
        const macroSql = `
            CREATE MACRO IF NOT EXISTS parse_num(col) AS 
            TRY_CAST(
                regexp_replace(
                    regexp_replace(CAST(col AS VARCHAR), '[$,€£%\\s]', '', 'g'),
                    '^\\((.*)\\)$',
                    '-\\1'
                ) AS DOUBLE
            );
        `;

        conn.run(macroSql, (err) => {
            if (err) {
                console.warn("[DuckDB Init Warning] Could not register parse_num macro:", err.message);
            }
        });

        isDuckDBReady = true;
        return conn;
    } catch (e) {
        console.warn("[DuckDB Init Error] Failed to initialize DuckDB:", e.message);
        isDuckDBReady = false;
        return null;
    }
}

// Initialize on module load
initDuckDB();

/**
 * Serializes BigInt values from DuckDB queries into standard JSON numbers.
 */
function serializeResults(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => {
        const clean = {};
        for (const [k, v] of Object.entries(row)) {
            if (typeof v === 'bigint') {
                clean[k] = Number(v);
            } else {
                clean[k] = v;
            }
        }
        return clean;
    });
}

/**
 * Loads a dataset into a dedicated DuckDB table.
 */
function loadDatasetToDuckDB({ tableName, rows, filePath = null, columns = [] }) {
    return new Promise((resolve, reject) => {
        const connection = initDuckDB();
        if (!connection) {
            return reject(new Error("DuckDB connection unavailable"));
        }

        // If file exists on disk, load via temporary ingest copy so the durable master file is never locked by DuckDB
        if (filePath && fs.existsSync(filePath)) {
            const uploadDir = path.resolve(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const tempIngestPath = path.join(uploadDir, `ingest_${tableName}_${uniqueSuffix}.csv`);
            try {
                fs.copyFileSync(filePath, tempIngestPath);
                const cleanPath = tempIngestPath.replace(/\\/g, '/');
                const sql = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${cleanPath}', ignore_errors=true);`;
                connection.run(sql, (err) => {
                    if (err) return reject(err);
                    resolve(tableName);
                });
                return;
            } catch (copyErr) {
                console.warn("[AnalyticalEngine] Ingest copy failed, falling back to direct load:", copyErr.message);
                const cleanPath = filePath.replace(/\\/g, '/');
                const sql = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${cleanPath}', ignore_errors=true);`;
                connection.run(sql, (err) => {
                    if (err) return reject(err);
                    resolve(tableName);
                });
                return;
            }
        }

        // If no file path, serialize rows to a temp CSV file and load
        const uploadDir = path.resolve(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const tempPath = path.join(uploadDir, `temp_${tableName}.csv`);
        try {
            if (!rows || rows.length === 0) {
                return reject(new Error("Cannot create table from empty rows."));
            }

            const headers = columns.length > 0 ? columns : Object.keys(rows[0]);
            let csvContent = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

            for (const r of rows) {
                const line = headers.map(h => {
                    const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
                    return `"${val.replace(/"/g, '""')}"`;
                }).join(',');
                csvContent += line + '\n';
            }

            fs.writeFileSync(tempPath, csvContent, 'utf8');
            const cleanPath = tempPath.replace(/\\/g, '/');
            const sql = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${cleanPath}', ignore_errors=true);`;

            connection.run(sql, (err) => {
                try { fs.unlinkSync(tempPath); } catch (e) {}
                if (err) return reject(err);
                resolve(tableName);
            });
        } catch (err) {
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
            reject(err);
        }
    });
}

/**
 * Drops a dataset table from DuckDB when the dataset is released.
 */
function dropDatasetFromDuckDB(tableName) {
    return new Promise((resolve) => {
        const connection = initDuckDB();
        if (!connection) return resolve(false);

        connection.run(`DROP TABLE IF EXISTS "${tableName}";`, (err) => {
            if (err) {
                console.warn(`[DuckDB Warning] Could not drop ${tableName}:`, err.message);
            }
            resolve(true);
        });
    });
}

/**
 * Checks whether a table exists in DuckDB.
 */
function tableExistsInDuckDB(tableName) {
    return new Promise((resolve) => {
        const connection = initDuckDB();
        if (!connection) return resolve(false);

        connection.all(`SELECT table_name FROM information_schema.tables WHERE table_name = ?`, [tableName], (err, rows) => {
            if (err || !rows) return resolve(false);
            resolve(rows.length > 0);
        });
    });
}

/**
 * Resets in-memory DuckDB instance (simulates process restart for testing).
 */
function resetDuckDB() {
    if (conn) {
        try { conn.close(); } catch (e) {}
    }
    if (db) {
        try { db.close(); } catch (e) {}
    }
    db = null;
    conn = null;
    isDuckDBReady = false;
    return initDuckDB();
}

/**
 * Escapes string literals for safe embedding in SQL WHERE clauses.
 */
function escapeSqlString(str) {
    if (str === null || str === undefined) return "''";
    return "'" + String(str).replace(/'/g, "''") + "'";
}

/**
 * Sanitizes and validates column identifiers.
 */
function safeIdent(colName, validColumns = []) {
    if (!colName || typeof colName !== 'string') return '';
    const match = validColumns.find(c => c.toLowerCase() === colName.trim().toLowerCase());
    const finalName = match || colName.trim();
    return `"${finalName.replace(/"/g, '""')}"`;
}

/**
 * Compiles a validated structured query into a safe DuckDB SQL statement.
 */
function compileQueryToSql(dataset, query) {
    const { operation, column, metric, limit, filters } = query;
    const validCols = dataset.columns || [];
    const tableName = `"${dataset.tableName}"`;

    // 1. Build WHERE conditions
    const whereClauses = [];

    if (Array.isArray(filters) && filters.length > 0) {
        for (const f of filters) {
            if (!f || !f.field) continue;
            const ident = safeIdent(f.field, validCols);
            const op = (f.operator || '=').toLowerCase();
            const val = f.value;

            // Check if filter value is numeric
            const numVal = parseNumericValue(val);

            if (op === 'contains') {
                const searchPattern = String(val).replace(/'/g, "''");
                whereClauses.push(`LOWER(CAST(${ident} AS VARCHAR)) LIKE '%${searchPattern.toLowerCase()}%'`);
            } else if (numVal !== null) {
                // Numeric comparison
                let sqlOp = '=';
                if (['=', '!=', '<>', '>', '<', '>=', '<='].includes(op)) {
                    sqlOp = op === '<>' ? '!=' : op;
                }
                whereClauses.push(`parse_num(${ident}) ${sqlOp} ${numVal}`);
            } else {
                // String comparison
                const escaped = escapeSqlString(val);
                let sqlOp = '=';
                if (['=', '!=', '<>', '>', '<', '>=', '<='].includes(op)) {
                    sqlOp = op === '<>' ? '!=' : op;
                }
                whereClauses.push(`LOWER(TRIM(CAST(${ident} AS VARCHAR))) ${sqlOp} LOWER(${escaped})`);
            }
        }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const safeLimit = (typeof limit === 'number' && limit > 0) ? Math.min(limit, 1000) : null;

    const targetMetricName = metric || column;
    const metricIdent = targetMetricName ? safeIdent(targetMetricName, validCols) : null;
    const columnIdent = column ? safeIdent(column, validCols) : null;

    let sql = '';

    switch (operation) {
        case 'sum':
            sql = `SELECT 'sum' AS operation, '${targetMetricName}' AS metric, COALESCE(ROUND(SUM(parse_num(${metricIdent})), 2), 0) AS value, COUNT(parse_num(${metricIdent})) AS validCount FROM ${tableName} ${whereSql}`;
            break;

        case 'average':
            sql = `SELECT 'average' AS operation, '${targetMetricName}' AS metric, ROUND(AVG(parse_num(${metricIdent})), 2) AS value, COUNT(parse_num(${metricIdent})) AS validCount FROM ${tableName} ${whereSql}`;
            break;

        case 'min':
            sql = `SELECT 'min' AS operation, '${targetMetricName}' AS metric, MIN(parse_num(${metricIdent})) AS value, COUNT(parse_num(${metricIdent})) AS validCount FROM ${tableName} ${whereSql}`;
            break;

        case 'max':
            sql = `SELECT 'max' AS operation, '${targetMetricName}' AS metric, MAX(parse_num(${metricIdent})) AS value, COUNT(parse_num(${metricIdent})) AS validCount FROM ${tableName} ${whereSql}`;
            break;

        case 'count':
            sql = `SELECT 'count' AS operation, COUNT(*) AS value FROM ${tableName} ${whereSql}`;
            break;

        case 'top':
            const topLimit = safeLimit || 5;
            sql = `SELECT * FROM ${tableName} ${whereSql} ORDER BY parse_num(${metricIdent}) DESC NULLS LAST LIMIT ${topLimit}`;
            break;

        case 'group_by':
            const groupLimit = safeLimit || 50;
            if (metricIdent && targetMetricName !== column) {
                sql = `SELECT ${columnIdent} AS "${column}", COALESCE(ROUND(SUM(parse_num(${metricIdent})), 2), 0) AS "${targetMetricName}", COUNT(parse_num(${metricIdent})) AS validCount, COUNT(*) AS totalCount FROM ${tableName} ${whereSql} GROUP BY ${columnIdent} ORDER BY "${targetMetricName}" DESC NULLS LAST LIMIT ${groupLimit}`;
            } else {
                sql = `SELECT ${columnIdent} AS "${column}", COUNT(*) AS count FROM ${tableName} ${whereSql} GROUP BY ${columnIdent} ORDER BY count DESC LIMIT ${groupLimit}`;
            }
            break;

        case 'filter':
        default:
            const filterLimit = safeLimit || 100;
            sql = `SELECT * FROM ${tableName} ${whereSql} LIMIT ${filterLimit}`;
            break;
    }

    return sql;
}

/**
 * Executes an analytical query against the dataset.
 * Uses DuckDB as primary engine with automatic JavaScript processor fallback.
 */
async function executeAnalyticalQuery(dataset, structuredQuery) {
    if (!dataset) {
        throw new Error("No dataset provided to executeAnalyticalQuery.");
    }

    const connection = initDuckDB();

    if (isDuckDBReady && connection && dataset.tableName) {
        try {
            // Ensure table is loaded in DuckDB; reconstruct from durable storage if needed (e.g. after backend restart)
            const exists = await tableExistsInDuckDB(dataset.tableName);
            if (!exists && dataset.filePath && fs.existsSync(dataset.filePath)) {
                await loadDatasetToDuckDB({
                    tableName: dataset.tableName,
                    filePath: dataset.filePath,
                    columns: dataset.columns
                });
            }

            const sql = compileQueryToSql(dataset, structuredQuery);
            const duckResults = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error("Analytical query execution timed out (5s limit)."));
                }, 5000);

                connection.all(sql, (err, rows) => {
                    clearTimeout(timer);
                    if (err) return reject(err);
                    resolve(serializeResults(rows));
                });
            });

            return {
                result: duckResults,
                metadata: {
                    engine: 'duckdb',
                    rowCount: duckResults.length,
                    sql
                }
            };
        } catch (err) {
            console.warn("[AnalyticalEngine] DuckDB query execution failed, falling back to JavaScript engine:", err.message);
        }
    }

    // JavaScript Fallback Engine
    const fallbackResults = processData(dataset.rawRows || dataset.data || [], structuredQuery);
    return {
        result: fallbackResults,
        metadata: {
            engine: 'javascript-fallback',
            rowCount: fallbackResults.length
        }
    };
}

module.exports = {
    initDuckDB,
    loadDatasetToDuckDB,
    dropDatasetFromDuckDB,
    tableExistsInDuckDB,
    resetDuckDB,
    compileQueryToSql,
    executeAnalyticalQuery,
    isDuckDBReady: () => isDuckDBReady
};

