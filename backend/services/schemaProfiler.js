/**
 * Schema Profiler and Type Ingestion Engine
 * Inspects tabular rows to detect column names, data types, format patterns,
 * missing-value rates, distinct samples, and summary statistics.
 */

const { parseNumericValue } = require('./dataProcessor');

// Common regex patterns for date detection
const DATE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/, // YYYY-MM-DD or ISO
    /^\d{4}\/\d{2}\/\d{2}$/,                                                       // YYYY/MM/DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,                                                   // M/D/YYYY or MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/                                                      // DD-MM-YYYY or MM-DD-YYYY
];

/**
 * Checks if a string represents a plausible date without treating plain numbers as dates.
 */
function isDateValue(val) {
    if (val === null || val === undefined) return false;
    if (typeof val === 'number') return false; // Don't treat raw numbers (like years 2023) as dates

    const str = String(val).trim();
    if (str === '') return false;

    // Must match a recognized date structure
    const matchesPattern = DATE_PATTERNS.some(regex => regex.test(str));
    if (!matchesPattern) return false;

    const parsed = Date.parse(str);
    return !isNaN(parsed);
}

/**
 * Checks if a string represents a boolean value.
 */
function isBooleanValue(val) {
    if (typeof val === 'boolean') return true;
    if (val === null || val === undefined) return false;
    const str = String(val).trim().toLowerCase();
    return ['true', 'false', 'yes', 'no'].includes(str);
}

/**
 * Checks if a value is blank, null, or represents a missing placeholder.
 */
function isMissingValue(val) {
    if (val === null || val === undefined) return true;
    const str = String(val).trim().toLowerCase();
    return ['', 'n/a', 'null', 'undefined', 'nan', 'none', '-'].includes(str);
}

/**
 * Normalizes column names into unique, safe identifiers.
 */
function sanitizeColumnName(rawName, existingNames = new Set()) {
    let name = String(rawName || '').trim();
    if (!name) {
        name = 'column';
    }

    // Replace spaces and special characters with underscores, keeping alphanumeric
    let safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!safeName) {
        safeName = 'col';
    }

    // Ensure uniqueness
    let candidate = safeName;
    let counter = 1;
    while (existingNames.has(candidate.toLowerCase())) {
        candidate = `${safeName}_${counter}`;
        counter++;
    }

    existingNames.add(candidate.toLowerCase());
    return candidate;
}

/**
 * Profiles an array of tabular row objects.
 * Samples up to 1,000 rows to keep profiling fast and memory-efficient.
 */
function profileDataset(rows, rawHeaders = null) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return {
            isValid: false,
            error: "Dataset is empty or contains no valid rows.",
            rowCount: 0,
            columnCount: 0,
            columns: [],
            schema: {}
        };
    }

    // Determine headers
    const sampleRow = rows[0];
    const initialHeaders = rawHeaders && Array.isArray(rawHeaders) && rawHeaders.length > 0
        ? rawHeaders
        : Object.keys(sampleRow);

    if (initialHeaders.length === 0) {
        return {
            isValid: false,
            error: "No header columns detected in the dataset.",
            rowCount: rows.length,
            columnCount: 0,
            columns: [],
            schema: {}
        };
    }

    // Deduplicate and map headers
    const existingSafeNames = new Set();
    const columnMapping = initialHeaders.map((rawHeader, idx) => {
        const safeName = sanitizeColumnName(rawHeader || `col_${idx + 1}`, existingSafeNames);
        return {
            originalName: rawHeader || safeName,
            safeName
        };
    });

    const sampleLimit = Math.min(rows.length, 1000);
    const sampleRows = rows.slice(0, sampleLimit);

    const schema = {};

    columnMapping.forEach(({ originalName, safeName }) => {
        let missingCount = 0;
        let numericCount = 0;
        let dateCount = 0;
        let booleanCount = 0;
        let stringCount = 0;

        const distinctSet = new Set();
        const displaySamples = [];
        const numericValues = [];

        for (let i = 0; i < sampleRows.length; i++) {
            const rawVal = sampleRows[i][originalName];

            if (isMissingValue(rawVal)) {
                missingCount++;
                continue;
            }

            const strVal = String(rawVal).trim();
            if (distinctSet.size < 50) {
                distinctSet.add(strVal);
            }
            if (displaySamples.length < 3 && !displaySamples.includes(strVal)) {
                displaySamples.push(strVal);
            }

            const num = parseNumericValue(rawVal);
            if (num !== null) {
                numericCount++;
                numericValues.push(num);
                continue;
            }

            if (isDateValue(rawVal)) {
                dateCount++;
                continue;
            }

            if (isBooleanValue(rawVal)) {
                booleanCount++;
                continue;
            }

            stringCount++;
        }

        const validSampleTotal = sampleRows.length - missingCount;
        let inferredType = 'text';

        if (validSampleTotal > 0) {
            const numericRatio = numericCount / validSampleTotal;
            const dateRatio = dateCount / validSampleTotal;
            const booleanRatio = booleanCount / validSampleTotal;

            if (numericRatio >= 0.8) {
                inferredType = 'numeric';
            } else if (dateRatio >= 0.8) {
                inferredType = 'date';
            } else if (booleanRatio >= 0.8) {
                inferredType = 'boolean';
            } else if (distinctSet.size <= 30 && distinctSet.size < validSampleTotal * 0.7) {
                inferredType = 'categorical';
            } else {
                inferredType = 'text';
            }
        }

        // Compute summary metrics for numeric columns
        let numericStats = null;
        if (inferredType === 'numeric' && numericValues.length > 0) {
            let sum = 0;
            let min = numericValues[0];
            let max = numericValues[0];

            for (const n of numericValues) {
                sum += n;
                if (n < min) min = n;
                if (n > max) max = n;
            }

            numericStats = {
                min: Number(min.toFixed(2)),
                max: Number(max.toFixed(2)),
                avg: Number((sum / numericValues.length).toFixed(2)),
                sum: Number(sum.toFixed(2))
            };
        }

        schema[originalName] = {
            name: safeName,
            originalName,
            type: inferredType,
            missingCount,
            missingRate: Number((missingCount / sampleRows.length).toFixed(3)),
            distinctCount: distinctSet.size,
            sampleDistinctValues: Array.from(distinctSet).slice(0, 10),
            sampleValues: displaySamples,
            numericStats
        };
    });

    const totalMissing = Object.values(schema).reduce((acc, col) => acc + col.missingCount, 0);
    const totalCells = rows.length * columnMapping.length;
    const completenessRate = totalCells > 0 ? Number(((totalCells - totalMissing) / totalCells).toFixed(3)) : 1.0;

    return {
        isValid: true,
        rowCount: rows.length,
        columnCount: columnMapping.length,
        columns: columnMapping.map(c => c.originalName),
        columnMapping,
        schema,
        dataQuality: {
            completenessRate,
            sampledRows: sampleLimit,
            totalRows: rows.length
        }
    };
}

module.exports = {
    profileDataset,
    sanitizeColumnName,
    isDateValue,
    isBooleanValue,
    isMissingValue
};

