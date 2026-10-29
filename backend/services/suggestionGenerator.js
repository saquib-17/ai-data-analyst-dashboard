/**
 * Suggestion Generator
 * Generates smart, contextual follow-up analytical questions strictly
 * grounded in the active dataset's schema and recent operation context.
 */

function generateSuggestions({ schema = {}, columns = [], currentQuery = "", lastOperation = null }) {
    const suggestions = [];

    const columnList = Array.isArray(columns) && columns.length > 0 
        ? columns 
        : Object.keys(schema);

    if (columnList.length === 0) return suggestions;

    // Classify available columns
    const numericCols = [];
    const categoricalCols = [];
    const dateCols = [];

    for (const col of columnList) {
        const info = schema[col] || {};
        if (info.type === 'numeric' || (!info.type && /sales|revenue|cost|price|amount|profit|qty|quantity|count|age|salary/i.test(col))) {
            numericCols.push(col);
        } else if (info.type === 'date' || (!info.type && /date|year|month|day|time/i.test(col))) {
            dateCols.push(col);
        } else {
            categoricalCols.push(col);
        }
    }

    const primaryMetric = (lastOperation && lastOperation.metric) || numericCols[0] || columnList[1];
    const primaryCat = (lastOperation && lastOperation.column) || categoricalCols[0] || columnList[0];
    const secondaryCat = categoricalCols.find(c => c !== primaryCat) || (dateCols.length > 0 ? dateCols[0] : null);

    // 1. Contextual follow-up suggestions based on previous operation
    if (lastOperation && lastOperation.operation) {
        const op = lastOperation.operation;

        if (op === 'top') {
            if (primaryCat && primaryMetric) {
                suggestions.push(`Break down ${primaryMetric} by ${primaryCat}`);
            }
            if (secondaryCat) {
                suggestions.push(`Filter by ${secondaryCat}`);
            }
            if (primaryMetric) {
                suggestions.push(`What is the average ${primaryMetric}?`);
            }
        } else if (op === 'sum' || op === 'average') {
            if (primaryCat && primaryMetric) {
                suggestions.push(`Break down ${primaryMetric} by ${primaryCat}`);
            }
            if (numericCols.length > 1) {
                const otherMetric = numericCols.find(m => m !== primaryMetric);
                if (otherMetric) suggestions.push(`What is the total ${otherMetric}?`);
            }
            if (primaryMetric && primaryCat) {
                suggestions.push(`Show top 5 ${primaryCat} by ${primaryMetric}`);
            }
        } else if (op === 'group_by') {
            if (secondaryCat && primaryMetric) {
                suggestions.push(`Group by ${secondaryCat} instead`);
            }
            if (primaryMetric && primaryCat) {
                suggestions.push(`Show top 3 ${primaryCat} by ${primaryMetric}`);
            }
            if (primaryMetric) {
                suggestions.push(`What is the total ${primaryMetric}?`);
            }
        }
    }

    // 2. Schema-based fallback suggestions
    if (suggestions.length < 3) {
        if (primaryCat && primaryMetric) {
            const candidate1 = `Top 5 ${primaryCat} by ${primaryMetric}`;
            if (!suggestions.includes(candidate1)) suggestions.push(candidate1);

            const candidate2 = `Break down ${primaryMetric} by ${primaryCat}`;
            if (!suggestions.includes(candidate2)) suggestions.push(candidate2);
        }

        if (primaryMetric) {
            const candidate3 = `What is the total ${primaryMetric}?`;
            if (!suggestions.includes(candidate3)) suggestions.push(candidate3);
        }

        if (dateCols.length > 0 && primaryMetric) {
            const candidate4 = `Show ${primaryMetric} trend by ${dateCols[0]}`;
            if (!suggestions.includes(candidate4)) suggestions.push(candidate4);
        }
    }

    // Return unique up to 4 suggestions
    return Array.from(new Set(suggestions)).slice(0, 4);
}

module.exports = {
    generateSuggestions
};

