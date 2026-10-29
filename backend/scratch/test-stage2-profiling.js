const { profileDataset, sanitizeColumnName, isDateValue } = require('../services/schemaProfiler');

console.log("Starting Schema Profiler Tests...\n");

let passed = 0;
let total = 0;

function assertTest(name, condition, details = "") {
    total++;
    if (condition) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } else {
        console.log(`❌ [FAIL] ${name} ${details}`);
    }
}

// 1. Column Sanitization and Duplicate Handling
const existing = new Set();
const col1 = sanitizeColumnName("Sales Amount ($)", existing);
const col2 = sanitizeColumnName("Sales Amount ($)", existing);
const col3 = sanitizeColumnName("  ", existing);

assertTest("Column names sanitized cleanly", col1 === "Sales_Amount");
assertTest("Duplicate column names disambiguated", col2 === "Sales_Amount_1");
assertTest("Blank column names given default", col3 === "column");

// 2. Date Value Detection
assertTest("ISO date recognized", isDateValue("2023-05-15"));
assertTest("Timestamp recognized", isDateValue("2023-05-15T14:30:00Z"));
assertTest("Slash date recognized", isDateValue("2023/05/15"));
assertTest("Pure numeric integer not recognized as date", !isDateValue(2023));
assertTest("Arbitrary text not recognized as date", !isDateValue("hello world"));

// 3. Comprehensive Schema Inference
const testData = [
    {
        Product: "Laptop",
        Price: "$1,200.50",
        Category: "Electronics",
        LaunchDate: "2023-01-10",
        Discount: "15%",
        Refunded: "false",
        Notes: "Popular high performance model with solid reviews"
    },
    {
        Product: "Phone",
        Price: "800",
        Category: "Electronics",
        LaunchDate: "2023-02-15",
        Discount: "10%",
        Refunded: "true",
        Notes: "Refurbished unit"
    },
    {
        Product: "Tablet",
        Price: "N/A",
        Category: "Electronics",
        LaunchDate: "2023-03-20",
        Discount: "0%",
        Refunded: "no",
        Notes: "Demo sample"
    },
    {
        Product: "Desk",
        Price: "($150.00)", // negative accounting
        Category: "Furniture",
        LaunchDate: "2022-11-05",
        Discount: "5%",
        Refunded: "yes",
        Notes: "Clearance discount item"
    },
    {
        Product: "Chair",
        Price: "",
        Category: "Furniture",
        LaunchDate: "2022-12-01",
        Discount: "20%",
        Refunded: "false",
        Notes: "Standard ergonomic mesh office chair"
    }
];

const profile = profileDataset(testData);

assertTest("Dataset valid", profile.isValid);
assertTest("Row count correct", profile.rowCount === 5);
assertTest("Column count correct", profile.columnCount === 7);

// Column Type Verifications
const schema = profile.schema;
assertTest("Price inferred as numeric", schema["Price"].type === "numeric");
assertTest("Price missing count detected (N/A + empty = 2)", schema["Price"].missingCount === 2);
assertTest("Price numeric stats min/max correct", schema["Price"].numericStats.min === -150 && schema["Price"].numericStats.max === 1200.5);
assertTest("Price numeric avg calculated across valid numbers", schema["Price"].numericStats.avg === 616.83); // (1200.5 + 800 - 150) / 3 = 616.83

assertTest("Category inferred as categorical", schema["Category"].type === "categorical");
assertTest("Category distinct count correct", schema["Category"].distinctCount === 2);

assertTest("LaunchDate inferred as date", schema["LaunchDate"].type === "date");
assertTest("Discount inferred as numeric (percentages)", schema["Discount"].type === "numeric");
assertTest("Refunded inferred as boolean", schema["Refunded"].type === "boolean");

assertTest("Completeness rate computed", profile.dataQuality.completenessRate > 0.9);

console.log(`\nSchema Profiler Tests Completed: ${passed}/${total} passed.`);
process.exit(passed === total ? 0 : 1);

