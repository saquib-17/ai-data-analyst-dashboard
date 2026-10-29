require('dotenv').config();
const OpenAI = require("openai");

const SUPPORTED_OPERATIONS = ['top', 'sum', 'average', 'count', 'min', 'max', 'group_by', 'filter'];
const SUPPORTED_OPERATORS = ['=', '!=', '<>', '>', '<', '>=', '<=', 'contains'];

const DEFAULT_RESPONSE = {
    operation: "",
    column: "",
    metric: "",
    limit: null,
    filters: []
};

let aiClient = null;

/**
 * Lazy initializer for OpenAI / Groq client to avoid throwing on module load
 * when running tests or when environment variables are not yet populated.
 */
function getAiClient() {
    if (!aiClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not configured on the server.");
        }
        aiClient = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });
    }
    return aiClient;
}

/**
 * Helper to match column names case-insensitively against available columns
 */
function resolveColumn(name, availableColumns = []) {
    if (!name || typeof name !== 'string') return '';
    const clean = name.trim();
    if (!Array.isArray(availableColumns) || availableColumns.length === 0) return clean;

    const lower = clean.toLowerCase();
    const exact = availableColumns.find(c => c === clean);
    if (exact) return exact;

    const matched = availableColumns.find(c => c.toLowerCase() === lower);
    return matched || clean;
}

/**
 * Formats dataset schema and samples into a clear context prompt for the LLM.
 */
function formatSchemaContext(datasetInfo = {}) {
    const columns = datasetInfo.columns || (datasetInfo.schema ? Object.keys(datasetInfo.schema) : []);
    const schema = datasetInfo.schema || {};

    if (!columns || columns.length === 0) {
        return "Dataset schema: No column information available.";
    }

    const lines = columns.map(col => {
        const info = schema[col] || {};
        const type = info.type || 'text';
        const samples = info.sampleDistinctValues && info.sampleDistinctValues.length > 0
            ? info.sampleDistinctValues.slice(0, 4).join(', ')
            : (info.sampleValues ? info.sampleValues.slice(0, 3).join(', ') : '');

        return `- "${col}" (${type}${samples ? `: e.g. ${samples}` : ''})`;
    });

    return `Available dataset columns and types:\n${lines.join('\n')}`;
}

/**
 * Validates and sanitizes AI-generated query structure against schema and constraints.
 */
function validateAndSanitize(data, availableColumns = []) {
    if (!data || typeof data !== 'object') {
        return {
            isValid: false,
            error: "Invalid query payload returned by AI parser.",
            query: { ...DEFAULT_RESPONSE }
        };
    }

    const rawOp = typeof data.operation === 'string' ? data.operation.trim().toLowerCase() : "";
    const operation = SUPPORTED_OPERATIONS.includes(rawOp) ? rawOp : "";

    let rawColumn = typeof data.column === 'string' ? data.column.trim() : "";
    let rawMetric = typeof data.metric === 'string' ? data.metric.trim() : "";

    let column = resolveColumn(rawColumn, availableColumns);
    let metric = resolveColumn(rawMetric, availableColumns);

    let limit = null;
    if (typeof data.limit === 'number' && Number.isInteger(data.limit) && data.limit > 0) {
        limit = Math.min(data.limit, 1000);
    } else if (typeof data.limit === 'string') {
        const parsedLimit = parseInt(data.limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
            limit = Math.min(parsedLimit, 1000);
        }
    }

    const filters = Array.isArray(data.filters)
        ? data.filters
            .filter(f => f && typeof f === 'object' && f.field)
            .map(f => {
                const field = resolveColumn(String(f.field).trim(), availableColumns);
                const rawFilterOp = String(f.operator || "=").trim().toLowerCase();
                const operator = SUPPORTED_OPERATORS.includes(rawFilterOp) ? rawFilterOp : "=";
                const value = f.value !== undefined ? f.value : "";
                return { field, operator, value };
            })
        : [];

    // Validation checks
    if (!operation && filters.length === 0) {
        return {
            isValid: false,
            error: "Could not identify a supported analytical operation or filter from your query. Try questions like 'top 5 sales', 'total revenue', or 'average age by region'.",
            query: { ...DEFAULT_RESPONSE }
        };
    }

    // Check target column / metric existence when availableColumns is supplied
    if (availableColumns.length > 0) {
        const target = metric || column;

        if (['sum', 'average', 'min', 'max', 'top'].includes(operation)) {
            if (!target) {
                return {
                    isValid: false,
                    error: `The operation '${operation}' requires a numeric column, but none was identified. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
            if (!availableColumns.includes(target)) {
                return {
                    isValid: false,
                    error: `Column '${target}' was not found in the dataset. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
        }

        if (operation === 'group_by') {
            if (!column) {
                return {
                    isValid: false,
                    error: `Grouping requires a category column. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
            if (!availableColumns.includes(column)) {
                return {
                    isValid: false,
                    error: `Grouping column '${column}' not found. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
            if (metric && !availableColumns.includes(metric)) {
                return {
                    isValid: false,
                    error: `Aggregation metric '${metric}' not found. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
        }

        // Validate filter fields
        for (const f of filters) {
            if (!availableColumns.includes(f.field)) {
                return {
                    isValid: false,
                    error: `Filter column '${f.field}' does not exist in the dataset. Available columns: ${availableColumns.join(', ')}.`,
                    query: { ...DEFAULT_RESPONSE }
                };
            }
        }
    }

    return {
        isValid: true,
        query: {
            operation: operation || (filters.length > 0 ? "filter" : ""),
            column,
            metric,
            limit,
            filters
        }
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert natural language query → structured JSON with schema and conversational follow-up awareness
 */
async function convertQueryToJson(query, datasetInfo = {}, conversationContext = {}, retry = true) {
    const availableColumns = Array.isArray(datasetInfo)
        ? datasetInfo
        : (datasetInfo.columns || (datasetInfo.schema ? Object.keys(datasetInfo.schema) : []));

    const schemaContext = formatSchemaContext(Array.isArray(datasetInfo) ? { columns: datasetInfo } : datasetInfo);

    let contextSection = "";
    if (conversationContext && typeof conversationContext === 'object') {
        const { previousOperation, recentMessages } = conversationContext;
        if (previousOperation && typeof previousOperation === 'object' && previousOperation.operation) {
            contextSection += `\nPrevious Validated Operation:\n${JSON.stringify(previousOperation, null, 2)}\n`;
        }
        if (Array.isArray(recentMessages) && recentMessages.length > 0) {
            const recentText = recentMessages
                .slice(-3)
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${String(m.content || '').slice(0, 150)}`)
                .join('\n');
            contextSection += `\nRecent Conversation Context:\n${recentText}\n`;
        }
    }

    const prompt = `
You are a senior data query parser.

Convert the user natural-language query into structured JSON for an analytical data engine.
${schemaContext}
${contextSection}
Supported operations:
- "top": sorted descending by a numeric metric with a limit (e.g. "top 5 products by sales")
- "sum": total sum of a numeric metric (e.g. "total sales", "sum of revenue")
- "average": mean average of a numeric metric (e.g. "average price", "avg cost")
- "min": lowest value of a numeric metric
- "max": highest value of a numeric metric
- "count": count of matching rows
- "group_by": group by a category/date column and aggregate an optional metric (e.g. "sales by region")
- "filter": general filtering of rows (e.g. "show orders in 2023")

Supported filter operators: "=", "!=", ">", "<", ">=", "<=", "contains"

Rules:
- Match column and metric names EXACTLY to the available dataset columns above.
- If the user query is a follow-up or refinement (e.g. "now break that down by region", "now show the bottom 5", "exclude North", "compare as average instead"), modify or adapt the Previous Validated Operation while retaining relevant metrics, columns, and filters.
- If the user asks a completely new question, ignore the previous operation.
- If a query asks for a single aggregate (e.g. total, sum, average, min, max), set operation accordingly and set "metric" to the numeric column.
- If a query asks for grouped results (e.g. by region, per category), set operation to "group_by", "column" to the group category, and "metric" to the aggregated numeric column.
- Return ONLY valid JSON matching the format below.
- No explanation or conversational markdown.

Format:
{
  "operation": "top" | "sum" | "average" | "count" | "min" | "max" | "group_by" | "filter",
  "column": "category_or_date_column_name_or_empty",
  "metric": "numeric_metric_column_name_or_empty",
  "limit": null or integer,
  "filters": [
    { "field": "column_name", "operator": "=", "value": "search_value" }
  ]
}

User Query: "${query.replace(/"/g, '\\"')}"
`;

    try {
        const client = getAiClient();
        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        let text = response.choices?.[0]?.message?.content || "{}";

        if (text.includes("```")) {
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        const parsedJson = JSON.parse(text);
        const validation = validateAndSanitize(parsedJson, availableColumns);

        if (!validation.isValid) {
            return { error: validation.error, query: validation.query };
        }

        return validation.query;

    } catch (error) {
        console.error("Query Parsing Error:", error.message);

        if (error.message.includes("429") && retry) {
            console.log("Rate limited (429). Retrying after 1.5s backoff...");
            await sleep(1500);
            return convertQueryToJson(query, datasetInfo, conversationContext, false);
        }

        return {
            error: error.message.includes("GROQ_API_KEY")
                ? "AI service is not configured (missing GROQ_API_KEY)."
                : `AI query parsing failed: ${error.message}`
        };
    }
}

/**
 * Generate human-readable insight strictly grounded in verified calculation results.
 */
async function generateInsight(originalQuery, results, context = {}) {
    if (!results || results.length === 0) {
        return "No matching records found for the query.";
    }

    // 1. Deterministic baseline summary
    let deterministicInsight = "";
    if (results.length === 1 && results[0].value !== undefined) {
        const valStr = typeof results[0].value === 'number'
            ? results[0].value.toLocaleString()
            : String(results[0].value);
        const validInfo = results[0].validCount !== undefined ? ` across ${results[0].validCount} valid records` : '';
        deterministicInsight = `The calculated ${results[0].operation} of ${results[0].metric || 'records'} is ${valStr}${validInfo}.`;
    } else if (context.operation === 'top') {
        const metricName = context.metric || 'values';
        deterministicInsight = `Retrieved the top ${results.length} records ordered by ${metricName}.`;
    } else if (context.operation === 'group_by') {
        deterministicInsight = `Summarized data into ${results.length} distinct groups.`;
    } else {
        deterministicInsight = `Found ${results.length} records matching your query criteria.`;
    }

    // If API key is not configured, return verified deterministic insight immediately
    if (!process.env.GROQ_API_KEY) {
        return deterministicInsight;
    }

    // 2. Prepare sample safely bounded
    const sampleLimit = Math.min(results.length, 5);
    const sample = results.slice(0, sampleLimit);
    const sampleStr = JSON.stringify(sample);

    const prompt = `
You are a senior data analyst.

Summarize the verified calculation results for the user query in ONE concise, professional sentence.

Query: ${originalQuery}
Verified Results (${sampleLimit} of ${results.length} rows): ${sampleStr}
Total Record Count: ${results.length}
Baseline Finding: ${deterministicInsight}

CRITICAL RULES:
- State the facts strictly grounded in the verified numbers shown above.
- NEVER invent or extrapolate numbers not present in the results.
- Output ONLY the single insight sentence.
`;

    try {
        const client = getAiClient();
        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 100
        });

        const content = response.choices?.[0]?.message?.content?.trim();
        return content || deterministicInsight;

    } catch (error) {
        console.warn("AI Insight Generation error (using deterministic fallback):", error.message);
        return deterministicInsight;
    }
}

module.exports = {
    convertQueryToJson,
    validateAndSanitize,
    generateInsight,
    resolveColumn,
    formatSchemaContext,
    SUPPORTED_OPERATIONS,
    SUPPORTED_OPERATORS
};
