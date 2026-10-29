const { validateAndSanitize, generateInsight, resolveColumn } = require('../services/queryParser');

const availableColumns = ["Product", "Sales", "Region", "Year"];

const testCases = [
    {
        name: "Normal input without column list",
        input: {
            operation: "top",
            column: "product",
            metric: "sales",
            limit: 5,
            filters: []
        },
        columns: [],
        expectedValid: true,
        expectedOp: "top"
    },
    {
        name: "Case-insensitive column resolution",
        input: {
            operation: "sum",
            metric: "sales"
        },
        columns: availableColumns,
        expectedValid: true,
        expectedMetric: "Sales"
    },
    {
        name: "Invalid column name when schema is provided",
        input: {
            operation: "sum",
            metric: "non_existent_column"
        },
        columns: availableColumns,
        expectedValid: false,
        expectedErrorSubstring: "was not found in the dataset"
    },
    {
        name: "Unsupported operation rejection",
        input: {
            operation: "drop_table",
            column: "Product"
        },
        columns: availableColumns,
        expectedValid: false,
        expectedErrorSubstring: "Could not identify a supported analytical operation"
    },
    {
        name: "Valid group_by with category and metric",
        input: {
            operation: "group_by",
            column: "region",
            metric: "sales"
        },
        columns: availableColumns,
        expectedValid: true,
        expectedCol: "Region",
        expectedMetric: "Sales"
    },
    {
        name: "Valid filter with resolved column name",
        input: {
            operation: "filter",
            filters: [
                { field: "year", operator: "=", value: 2023 }
            ]
        },
        columns: availableColumns,
        expectedValid: true,
        validateQuery: (q) => q.filters[0].field === "Year" && q.filters[0].operator === "="
    }
];

console.log("Running Query Parser Validation Tests...\n");

let passed = 0;
testCases.forEach(tc => {
    const result = validateAndSanitize(tc.input, tc.columns);
    let ok = false;

    if (tc.expectedValid !== undefined && result.isValid !== tc.expectedValid) {
        ok = false;
    } else if (!result.isValid && tc.expectedErrorSubstring) {
        ok = result.error && result.error.includes(tc.expectedErrorSubstring);
    } else if (result.isValid) {
        ok = true;
        if (tc.expectedOp && result.query.operation !== tc.expectedOp) ok = false;
        if (tc.expectedMetric && result.query.metric !== tc.expectedMetric) ok = false;
        if (tc.expectedCol && result.query.column !== tc.expectedCol) ok = false;
        if (tc.validateQuery && !tc.validateQuery(result.query)) ok = false;
    }

    if (ok) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${tc.name}`);
        console.log("   Result:", JSON.stringify(result, null, 2));
    }
});

// Test deterministic insight generator
console.log("\nTesting Deterministic Insight Fallbacks...\n");
(async () => {
    let insightPassed = 0;

    const sumResult = [{ operation: "sum", metric: "Sales", value: 3050, validCount: 6 }];
    const insight1 = await generateInsight("total sales", sumResult);
    if (insight1.includes("3,050") && insight1.includes("Sales")) {
        console.log("✅ [PASS] Grounded aggregation insight generated");
        insightPassed++;
    } else {
        console.log("❌ [FAIL] Grounded aggregation insight:", insight1);
    }

    const emptyResult = [];
    const insight2 = await generateInsight("find aliens", emptyResult);
    if (insight2.includes("No matching records")) {
        console.log("✅ [PASS] Empty result insight handled");
        insightPassed++;
    } else {
        console.log("❌ [FAIL] Empty result insight:", insight2);
    }

    console.log(`\nTests Completed: ${passed}/${testCases.length} validation tests passed. ${insightPassed}/2 insight tests passed.`);

    if (passed === testCases.length && insightPassed === 2) {
        process.exit(0);
    } else {
        process.exit(1);
    }
})();
