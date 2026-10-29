/**
 * Deterministic Chart Recommendation Engine
 * Evaluates query operation, result shape, and column schema to select
 * the most effective visualization (kpi, bar, line, area, pie, table).
 */

function recommendChart({ operation, column, metric, results, schema = {} }) {
    if (!Array.isArray(results) || results.length === 0) {
        return {
            type: "table",
            title: "No Data Available",
            xKey: null,
            yKey: null,
            data: []
        };
    }

    // 1. Single aggregate value (sum, average, count, min, max)
    if (results.length === 1 && results[0].value !== undefined) {
        return {
            type: "kpi",
            title: `${(operation || 'Result').toUpperCase()} of ${metric || 'records'}`,
            operation: results[0].operation || operation,
            metric: results[0].metric || metric || "Records",
            value: results[0].value,
            validCount: results[0].validCount,
            data: results
        };
    }

    const firstItem = results[0];
    const keys = Object.keys(firstItem);

    // Identify category key (string/date) and numeric key
    let categoryKey = column || keys.find(k => {
        const val = firstItem[k];
        return typeof val === 'string' || val instanceof Date;
    }) || keys[0];

    let numericKey = metric || keys.find(k => {
        if (k === categoryKey) return false;
        const val = firstItem[k];
        return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
    }) || null;

    // If no distinct numeric key exists, fallback to tabular view
    if (!numericKey || categoryKey === numericKey) {
        return {
            type: "table",
            title: "Data Records",
            xKey: null,
            yKey: null,
            data: results
        };
    }

    // Column metadata check
    const colMeta = schema[categoryKey] || {};
    const isDateColumn = colMeta.type === 'date' || 
        /date|month|year|day|time|quarter|period/i.test(categoryKey);

    // 2. Time-series trend: Line or Area chart
    if (isDateColumn && results.length >= 2) {
        return {
            type: results.length > 10 ? "area" : "line",
            title: `${metric || 'Values'} over ${categoryKey}`,
            xKey: categoryKey,
            yKey: numericKey,
            data: results
        };
    }

    // 3. Proportions / small categorical breakdown: Pie chart
    const allPositive = results.every(r => Number(r[numericKey]) >= 0);
    if (results.length >= 2 && results.length <= 5 && allPositive && operation === 'group_by') {
        return {
            type: "pie",
            title: `${metric || 'Distribution'} by ${categoryKey}`,
            xKey: categoryKey,
            yKey: numericKey,
            data: results
        };
    }

    // 4. Categorical comparison / Top-N: Bar chart
    if (operation === 'top' || operation === 'group_by' || results.length <= 25) {
        return {
            type: "bar",
            title: operation === 'top' 
                ? `Top ${results.length} by ${numericKey}` 
                : `${numericKey} by ${categoryKey}`,
            xKey: categoryKey,
            yKey: numericKey,
            data: results
        };
    }

    // Default to table for large result sets
    return {
        type: "table",
        title: "Query Results",
        xKey: categoryKey,
        yKey: numericKey,
        data: results
    };
}

module.exports = {
    recommendChart
};
