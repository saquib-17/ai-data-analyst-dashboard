const { validateAndSanitize } = require('../services/queryParser');

const testCases = [
    {
        name: "Normal input",
        input: {
            operation: "top",
            column: "product",
            metric: "sales",
            limit: 5,
            filters: []
        },
        expected: {
            operation: "top",
            column: "product",
            metric: "sales",
            limit: 5,
            filters: []
        }
    },
    {
        name: "Missing fields",
        input: {
            operation: "SUM"
        },
        expected: {
            operation: "sum",
            column: "",
            metric: "",
            limit: null,
            filters: []
        }
    },
    {
        name: "Invalid limit and missing filters",
        input: {
            operation: "average",
            limit: "all"
        },
        expected: {
            operation: "average",
            column: "",
            metric: "",
            limit: null,
            filters: []
        }
    },
    {
        name: "Filters with missing fields",
        input: {
            operation: "filter",
            filters: [
                { field: "year", value: 2023 }
            ]
        },
        expected: {
            operation: "filter",
            column: "",
            metric: "",
            limit: null,
            filters: [
                { field: "year", operator: "=", value: 2023 }
            ]
        }
    }
];

console.log("Running Query Parser Validation Tests...\n");

let passed = 0;
testCases.forEach(tc => {
    const result = validateAndSanitize(tc.input);
    const resultStr = JSON.stringify(result);
    const expectedStr = JSON.stringify(tc.expected);

    if (resultStr === expectedStr) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${tc.name}`);
        console.log(`   Expected: ${expectedStr}`);
        console.log(`   Received: ${resultStr}`);
    }
});

console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
