const { processData, parseNumericValue } = require('../services/dataProcessor');

// 1. Test parseNumericValue directly
console.log("Running parseNumericValue Unit Tests...\n");
const parseTests = [
    { input: 1200, expected: 1200 },
    { input: "1200", expected: 1200 },
    { input: "1,200", expected: 1200 },
    { input: "$1,200.50", expected: 1200.50 },
    { input: "-$50.00", expected: -50 },
    { input: "$-50.00", expected: -50 },
    { input: "($50.00)", expected: -50 },
    { input: "-1,200.50", expected: -1200.50 },
    { input: "0.75", expected: 0.75 },
    { input: ".5", expected: 0.5 },
    { input: "0", expected: 0 },
    { input: "15%", expected: 15 },
    { input: "15.5%", expected: 15.5 },
    { input: "", expected: null },
    { input: "   ", expected: null },
    { input: "N/A", expected: null },
    { input: "null", expected: null },
    { input: "undefined", expected: null },
    { input: "Laptop", expected: null },
    { input: null, expected: null },
    { input: undefined, expected: null }
];

let parsePassed = 0;
parseTests.forEach((t, i) => {
    const res = parseNumericValue(t.input);
    if (res === t.expected) {
        parsePassed++;
    } else {
        console.log(`❌ [FAIL parseNumericValue] Input: ${JSON.stringify(t.input)}, Expected: ${t.expected}, Received: ${res}`);
    }
});
console.log(`parseNumericValue Tests: ${parsePassed}/${parseTests.length} passed.\n`);

// 2. Test processData with formatted and messy data
const mockDataset = [
    { product: "Laptop", sales: 1200, region: "North", year: 2023, discount: "15%" },
    { product: "Phone", sales: 800, region: "South", year: 2023, discount: "10%" },
    { product: "Tablet", sales: 600, region: "North", year: 2022, discount: "5%" },
    { product: "Monitor", sales: 300, region: "East", year: 2023, discount: "0%" },
    { product: "Mouse", sales: 50, region: "West", year: 2023, discount: "20%" },
    { product: "Keyboard", sales: 100, region: "North", year: 2022, discount: "12%" }
];

const messyDataset = [
    { item: "A", revenue: "$1,200.50", cost: "500", category: "Electronics" },
    { item: "B", revenue: "$2,400.00", cost: "1,100.50", category: "Electronics" },
    { item: "C", revenue: "N/A", cost: "300", category: "Stationery" },
    { item: "D", revenue: "-$100.50", cost: "50", category: "Refunds" },
    { item: "E", revenue: "", cost: "N/A", category: "Stationery" }
];

const testCases = [
    {
        name: "Top 3 Products by Sales",
        dataset: mockDataset,
        query: { operation: "top", metric: "sales", limit: 3, filters: [] },
        validate: (res) => res.length === 3 && res[0].product === "Laptop"
    },
    {
        name: "Sum of Sales",
        dataset: mockDataset,
        query: { operation: "sum", metric: "sales", filters: [] },
        validate: (res) => res[0].value === 3050
    },
    {
        name: "Average Sales",
        dataset: mockDataset,
        query: { operation: "average", metric: "sales", filters: [] },
        validate: (res) => Math.round(res[0].value) === 508
    },
    {
        name: "Group by Region (sum sales)",
        dataset: mockDataset,
        query: { operation: "group_by", column: "region", metric: "sales", filters: [] },
        validate: (res) => {
            const north = res.find(r => r.region === "North");
            return north && north.sales === 1900;
        }
    },
    {
        name: "Filter by Year 2023 and Top 2",
        dataset: mockDataset,
        query: { 
            operation: "top", 
            metric: "sales", 
            limit: 2, 
            filters: [{ field: "year", operator: "=", value: 2023 }] 
        },
        validate: (res) => res.length === 2 && res.every(r => r.year == 2023)
    },
    // New Messy/Currency Test Cases
    {
        name: "Sum of Revenue with Currency and Commas",
        dataset: messyDataset,
        query: { operation: "sum", metric: "revenue", filters: [] },
        // $1200.50 + $2400.00 - $100.50 = 3500.00 (ignores N/A and "")
        validate: (res) => res[0].value === 3500 && res[0].validCount === 3
    },
    {
        name: "Average Revenue ignoring N/A and blank rows",
        dataset: messyDataset,
        query: { operation: "average", metric: "revenue", filters: [] },
        // 3500 / 3 valid rows = 1166.67 (NOT divided by 5 rows which would be 700)
        validate: (res) => Math.round(res[0].value) === 1167 && res[0].validCount === 3
    },
    {
        name: "Top Revenue with Currency and Negatives",
        dataset: messyDataset,
        query: { operation: "top", metric: "revenue", limit: 2, filters: [] },
        validate: (res) => res.length === 2 && res[0].item === "B" && res[1].item === "A"
    },
    {
        name: "Filter by Contains and Negative Numeric",
        dataset: messyDataset,
        query: { 
            operation: "filter", 
            filters: [{ field: "category", operator: "contains", value: "tron" }] 
        },
        validate: (res) => res.length === 2 && res.every(r => r.category === "Electronics")
    },
    {
        name: "Group by Category with Formatted Currency Metric",
        dataset: messyDataset,
        query: { operation: "group_by", column: "category", metric: "revenue", filters: [] },
        validate: (res) => {
            const elec = res.find(r => r.category === "Electronics");
            return elec && elec.revenue === 3600.50 && elec.validCount === 2;
        }
    }
];

console.log("Running Data Processor Test Cases...\n");

let passed = 0;
testCases.forEach(tc => {
    try {
        const result = processData(tc.dataset, tc.query);
        if (tc.validate(result)) {
            console.log(`✅ [PASS] ${tc.name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${tc.name}`);
            console.log("   Result:", JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.log(`❌ [ERROR] ${tc.name}: ${err.message}`);
    }
});

console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length && parsePassed === parseTests.length) {
    process.exit(0);
} else {
    process.exit(1);
}
