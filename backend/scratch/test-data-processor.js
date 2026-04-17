const { processData } = require('../services/dataProcessor');

const mockDataset = [
    { product: "Laptop", sales: 1200, region: "North", year: 2023 },
    { product: "Phone", sales: 800, region: "South", year: 2023 },
    { product: "Tablet", sales: 600, region: "North", year: 2022 },
    { product: "Monitor", sales: 300, region: "East", year: 2023 },
    { product: "Mouse", sales: 50, region: "West", year: 2023 },
    { product: "Keyboard", sales: 100, region: "North", year: 2022 }
];

const testCases = [
    {
        name: "Top 3 Products by Sales",
        query: { operation: "top", metric: "sales", limit: 3, filters: [] },
        validate: (res) => res.length === 3 && res[0].product === "Laptop"
    },
    {
        name: "Sum of Sales",
        query: { operation: "sum", metric: "sales", filters: [] },
        validate: (res) => res[0].value === 3050
    },
    {
        name: "Average Sales",
        query: { operation: "average", metric: "sales", filters: [] },
        validate: (res) => Math.round(res[0].value) === 508
    },
    {
        name: "Group by Region (sum sales)",
        query: { operation: "group_by", column: "region", metric: "sales", filters: [] },
        validate: (res) => {
            const north = res.find(r => r.region === "North");
            return north && north.sales === 1900;
        }
    },
    {
        name: "Filter by Year 2023 and Top 2",
        query: { 
            operation: "top", 
            metric: "sales", 
            limit: 2, 
            filters: [{ field: "year", operator: "=", value: 2023 }] 
        },
        validate: (res) => res.length === 2 && res.every(r => r.year == 2023)
    }
];

console.log("Running Data Processor Tests...\n");

let passed = 0;
testCases.forEach(tc => {
    try {
        const result = processData(mockDataset, tc.query);
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
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
