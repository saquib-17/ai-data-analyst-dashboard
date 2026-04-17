/**
 * Handles data processing logic for the AI dashboard.
 * Supports filtering, aggregation (sum, average, count), grouping, and limits.
 */

function processData(dataset, query) {
    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
        return [];
    }

    let processedResults = [...dataset];

    // 1. Apply Filters
    if (query.filters && query.filters.length > 0) {
        processedResults = processedResults.filter(item => {
            return query.filters.every(f => {
                const val = item[f.field];
                const filterVal = f.value;

                // Try to handle numeric comparisons
                const nVal = parseFloat(val);
                const nFilterVal = parseFloat(filterVal);

                const isNumeric = !isNaN(nVal) && !isNaN(nFilterVal);

                switch (f.operator) {
                    case "=":
                        return val == filterVal;
                    case ">":
                        return isNumeric ? nVal > nFilterVal : val > filterVal;
                    case "<":
                        return isNumeric ? nVal < nFilterVal : val < filterVal;
                    case ">=":
                        return isNumeric ? nVal >= nFilterVal : val >= filterVal;
                    case "<=":
                        return isNumeric ? nVal <= nFilterVal : val <= filterVal;
                    default:
                        return true;
                }
            });
        });
    }

    const { operation, column, metric, limit } = query;

    // 2. Apply Operations
    switch (operation) {
        case "top":
            if (metric) {
                processedResults.sort((a, b) => {
                    const valA = parseFloat(a[metric]) || 0;
                    const valB = parseFloat(b[metric]) || 0;
                    return valB - valA;
                });
            }
            if (limit) {
                processedResults = processedResults.slice(0, limit);
            }
            break;

        case "sum":
            if (metric) {
                const total = processedResults.reduce((acc, item) => {
                    return acc + (parseFloat(item[metric]) || 0);
                }, 0);
                return [{ operation: "sum", metric, value: total }];
            }
            break;

        case "average":
            if (metric && processedResults.length > 0) {
                const total = processedResults.reduce((acc, item) => {
                    return acc + (parseFloat(item[metric]) || 0);
                }, 0);
                return [{ operation: "average", metric, value: total / processedResults.length }];
            }
            break;

        case "count":
            return [{ operation: "count", value: processedResults.length }];

        case "group_by":
            if (column && metric) {
                const groups = {};
                processedResults.forEach(item => {
                    const key = item[column] || "Unknown";
                    if (!groups[key]) groups[key] = 0;
                    groups[key] += parseFloat(item[metric]) || 0;
                });
                processedResults = Object.keys(groups).map(key => ({
                    [column]: key,
                    [metric]: groups[key]
                })).sort((a, b) => b[metric] - a[metric]);
            }
            break;

        default:
            // For "filter" or unknown operations, just return the filtered list
            if (limit) {
                processedResults = processedResults.slice(0, limit);
            }
            break;
    }

    return processedResults;
}

module.exports = {
    processData
};
