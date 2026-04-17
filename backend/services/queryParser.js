require('dotenv').config();
const OpenAI = require("openai");

const ai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const DEFAULT_RESPONSE = {
    operation: "",
    column: "",
    metric: "",
    limit: null,
    filters: []
};

function validateAndSanitize(data) {
    if (!data || typeof data !== 'object') return { ...DEFAULT_RESPONSE };

    return {
        operation: typeof data.operation === 'string' ? data.operation.toLowerCase() : "",
        column: typeof data.column === 'string' ? data.column : "",
        metric: typeof data.metric === 'string' ? data.metric : "",
        limit: (typeof data.limit === 'number' || data.limit === null) ? data.limit : null,
        filters: Array.isArray(data.filters)
            ? data.filters.map(f => ({
                field: f.field || "",
                operator: f.operator || "=",
                value: f.value !== undefined ? f.value : ""
            }))
            : []
    };
}

// helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert query → structured JSON
 */
async function convertQueryToJson(query, retry = true) {
    const prompt = `
You are a data query parser.

Convert the user query into JSON.

Rules:
- Return ONLY valid JSON
- No explanation

Format:
{
  "operation": "",
  "column": "",
  "metric": "",
  "limit": null,
  "filters": []
}

Query: ${query}
`;

    try {
        const response = await ai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0
        });

        let text = response.choices?.[0]?.message?.content || "";

        if (text.includes("```")) {
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        return validateAndSanitize(JSON.parse(text));

    } catch (error) {
        console.error("Query Parsing Error:", error.message);

        if (error.message.includes("429") && retry) {
            console.log("Retrying after 10s...");
            await sleep(10000);
            return convertQueryToJson(query, false);
        }

        return { ...DEFAULT_RESPONSE };
    }
}

/**
 * Generate insight
 */
async function generateInsight(originalQuery, results) {
    if (!results || results.length === 0) return "No data found.";

    const summary = results
        .slice(0, 3)
        .map(r => JSON.stringify(r))
        .join(", ");

    const prompt = `
You are a data analyst.

Generate ONE short professional insight.

Query: ${originalQuery}
Results: [${summary}${results.length > 3 ? ", ..." : ""}]
Total: ${results.length}

Return ONLY one sentence.
`;

    try {
        const response = await ai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3
        });

        return response.choices?.[0]?.message?.content?.trim() || "Insight unavailable.";

    } catch (error) {
        console.error("Insight Error:", error.message);
        return "Insight generation failed.";
    }
}

module.exports = {
    convertQueryToJson,
    validateAndSanitize,
    generateInsight
};