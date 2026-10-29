/**
 * Handles data processing logic for the AI dashboard.
 * Supports filtering, aggregation (sum, average, count), grouping, and limits.
 * Performs deterministic calculations with safe numeric parsing for currency, commas, and negative values.
 */

/**
 * Safely parses numbers from various formats (e.g. 1200, "1,200", "$1,200.50", "-$50.00", "($50)", "15%", ".5").
 * Returns a finite number, or null if the value is missing, blank, or non-numeric.
 * IMPORTANT: Never returns 0 for non-numeric/missing strings like "" or "N/A".
 */
function parseNumericValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') {
        return Number.isFinite(val) ? val : null;
    }

    let str = String(val).trim();
    if (str === '') return null;

    const lower = str.toLowerCase();
    if (lower === 'n/a' || lower === 'null' || lower === 'undefined' || lower === 'nan' || lower === 'none' || lower === '-') {
        return null;
    }

    let isNegative = false;

    // Accounting negative format: (1,200.50) or ($1,200.50)
    if (str.startsWith('(') && str.endsWith(')')) {
        isNegative = true;
        str = str.slice(1, -1).trim();
    }

    // Leading negative sign before currency: -$1200 or $-1200
    if (str.startsWith('-')) {
        isNegative = true;
        str = str.slice(1).trim();
    }

    // Remove common currency symbols and whitespace
    str = str.replace(/[$€£¥₹\s]/g, '');

    // Negative sign after currency symbol: $-1,200
    if (str.startsWith('-')) {
        isNegative = true;
        str = str.slice(1).trim();
    }

    // Percentage sign: "15%" or "15.5%" -> 15 or 15.5
    if (str.endsWith('%')) {
        str = str.slice(0, -1).trim();
    }

    // Remove thousand separator commas: "1,200,000.50" -> "1200000.50"
    str = str.replace(/,/g, '');

    // Must match valid numeric pattern
    if (!/^(\d+(\.\d*)?|\.\d+)$/.test(str)) {
        return null;
    }

    const num = Number(str);
    if (!Number.isFinite(num)) return null;

    return isNegative ? -num : num;
}

function processData(dataset, query) {
    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
        return [];
    }

    if (!query || typeof query !== 'object') {
        return [...dataset];
    }

    let processedResults = [...dataset];

    // 1. Apply Filters
    if (Array.isArray(query.filters) && query.filters.length > 0) {
        processedResults = processedResults.filter(item => {
            return query.filters.every(f => {
                if (!f || !f.field) return true;
                const rawVal = item[f.field];
                const filterVal = f.value;

                const nVal = parseNumericValue(rawVal);
                const nFilterVal = parseNumericValue(filterVal);
                const isNumeric = nVal !== null && nFilterVal !== null;

                const op = f.operator || "=";
                if (isNumeric) {
                    switch (op) {
                        case "=": return nVal === nFilterVal;
                        case "!=":
                        case "<>": return nVal !== nFilterVal;
                        case ">": return nVal > nFilterVal;
                        case "<": return nVal < nFilterVal;
                        case ">=": return nVal >= nFilterVal;
                        case "<=": return nVal <= nFilterVal;
                        default: return true;
                    }
                }

                // If filter value is numeric but row value is missing/non-numeric, inequality is false
                if (nFilterVal !== null && nVal === null) {
                    if (op === "!=" || op === "<>") return true;
                    return false;
                }

                // Non-numeric string comparison
                const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim().toLowerCase() : "";
                const strFilterVal = filterVal !== undefined && filterVal !== null ? String(filterVal).trim().toLowerCase() : "";

                switch (op) {
                    case "=": return strVal === strFilterVal;
                    case "!=":
                    case "<>": return strVal !== strFilterVal;
                    case "contains": return strVal.includes(strFilterVal);
                    case ">": return strVal > strFilterVal;
                    case "<": return strVal < strFilterVal;
                    case ">=": return strVal >= strFilterVal;
                    case "<=": return strVal <= strFilterVal;
                    default: return true;
                }
            });
        });
    }

    const { operation, column, metric, limit } = query;
    const targetMetric = metric || column;

    // 2. Apply Operations
    switch (operation) {
        case "top":
            if (targetMetric) {
                processedResults.sort((a, b) => {
                    const valA = parseNumericValue(a[targetMetric]);
                    const valB = parseNumericValue(b[targetMetric]);

                    // Items with valid numbers sort first, highest to lowest
                    if (valA !== null && valB !== null) return valB - valA;
                    if (valA !== null && valB === null) return -1;
                    if (valA === null && valB !== null) return 1;
                    return 0;
                });
            }
            if (typeof limit === 'number' && limit > 0) {
                processedResults = processedResults.slice(0, limit);
            }
            break;

        case "sum":
            if (targetMetric) {
                let total = 0;
                let validCount = 0;
                for (const item of processedResults) {
                    const n = parseNumericValue(item[targetMetric]);
                    if (n !== null) {
                        total += n;
                        validCount++;
                    }
                }
                return [{
                    operation: "sum",
                    metric: targetMetric,
                    value: Number(total.toFixed(2)),
                    validCount: validCount
                }];
            }
            break;

        case "min":
            if (targetMetric) {
                let minVal = null;
                let validCount = 0;
                for (const item of processedResults) {
                    const n = parseNumericValue(item[targetMetric]);
                    if (n !== null) {
                        if (minVal === null || n < minVal) minVal = n;
                        validCount++;
                    }
                }
                return [{
                    operation: "min",
                    metric: targetMetric,
                    value: minVal,
                    validCount: validCount
                }];
            }
            break;

        case "max":
            if (targetMetric) {
                let maxVal = null;
                let validCount = 0;
                for (const item of processedResults) {
                    const n = parseNumericValue(item[targetMetric]);
                    if (n !== null) {
                        if (maxVal === null || n > maxVal) maxVal = n;
                        validCount++;
                    }
                }
                return [{
                    operation: "max",
                    metric: targetMetric,
                    value: maxVal,
                    validCount: validCount
                }];
            }
            break;

        case "average":
            if (targetMetric) {
                let total = 0;
                let validCount = 0;
                for (const item of processedResults) {
                    const n = parseNumericValue(item[targetMetric]);
                    if (n !== null) {
                        total += n;
                        validCount++;
                    }
                }
                if (validCount === 0) {
                    return [{
                        operation: "average",
                        metric: targetMetric,
                        value: null,
                        validCount: 0,
                        message: "No valid numeric values found to calculate average."
                    }];
                }
                return [{
                    operation: "average",
                    metric: targetMetric,
                    value: Number((total / validCount).toFixed(2)),
                    validCount: validCount
                }];
            }
            break;

        case "count":
            return [{ operation: "count", value: processedResults.length }];

        case "group_by":
            if (column) {
                const groups = {};
                processedResults.forEach(item => {
                    const key = (item[column] !== null && item[column] !== undefined && String(item[column]).trim() !== "")
                        ? String(item[column]).trim()
                        : "Unknown";

                    if (!groups[key]) {
                        groups[key] = { sum: 0, validCount: 0, totalCount: 0 };
                    }
                    groups[key].totalCount++;

                    if (targetMetric && targetMetric !== column) {
                        const n = parseNumericValue(item[targetMetric]);
                        if (n !== null) {
                            groups[key].sum += n;
                            groups[key].validCount++;
                        }
                    }
                });

                processedResults = Object.keys(groups).map(key => {
                    const groupItem = { [column]: key };
                    if (targetMetric && targetMetric !== column) {
                        groupItem[targetMetric] = Number(groups[key].sum.toFixed(2));
                        groupItem.validCount = groups[key].validCount;
                    } else {
                        groupItem.count = groups[key].totalCount;
                    }
                    return groupItem;
                });

                if (targetMetric && targetMetric !== column) {
                    processedResults.sort((a, b) => (b[targetMetric] || 0) - (a[targetMetric] || 0));
                } else {
                    processedResults.sort((a, b) => b.count - a.count);
                }

                if (typeof limit === 'number' && limit > 0) {
                    processedResults = processedResults.slice(0, limit);
                }
            }
            break;

        default:
            // For "filter" or read-only listings, return the filtered subset with optional limit
            if (typeof limit === 'number' && limit > 0) {
                processedResults = processedResults.slice(0, limit);
            }
            break;
    }

    return processedResults;
}

module.exports = {
    processData,
    parseNumericValue
};
