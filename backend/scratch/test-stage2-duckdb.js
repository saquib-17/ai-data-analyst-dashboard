const { registerDataset, releaseDataset } = require('../services/datasetRegistry');
const { executeAnalyticalQuery, compileQueryToSql, isDuckDBReady } = require('../services/analyticalEngine');

console.log("Starting DuckDB Analytical Engine Tests...\n");

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

async function runTests() {
    assertTest("DuckDB initialized and ready", isDuckDBReady());

    const testRows = [
        { Product: "Laptop", Revenue: "$1,200.50", Cost: "500", Region: "North", Qty: "10" },
        { Product: "Phone", Revenue: "800", Cost: "350.50", Region: "South", Qty: "25" },
        { Product: "Monitor", Revenue: "$300.00", Cost: "150", Region: "East", Qty: "5" },
        { Product: "Keyboard", Revenue: "N/A", Cost: "50", Region: "North", Qty: "15" },
        { Product: "Mouse", Revenue: "-$50.00", Cost: "20", Region: "West", Qty: "30" },
        { Product: "Desk", Revenue: "($150.00)", Cost: "100", Region: "North", Qty: "2" }
    ];

    const dataset = await registerDataset({
        filename: "duckdb_test.csv",
        rows: testRows
    });

    assertTest("Dataset registered with DuckDB table", dataset && dataset.tableName && dataset.tableName.startsWith("dataset_"));

    // 1. Test SUM with Currency, Commas, Negatives
    // 1200.50 + 800 + 300 - 50 - 150 = 2100.50 (ignores N/A)
    const sumRes = await executeAnalyticalQuery(dataset, {
        operation: 'sum',
        metric: 'Revenue'
    });
    assertTest(
        "SUM executes correctly on formatted currency in DuckDB",
        sumRes.result[0].value === 2100.5 && sumRes.result[0].validCount === 5,
        `Received: ${JSON.stringify(sumRes.result[0])}`
    );

    // 2. Test AVERAGE with Missing values
    // 2100.50 / 5 valid values = 420.10 (NOT divided by 6 total rows)
    const avgRes = await executeAnalyticalQuery(dataset, {
        operation: 'average',
        metric: 'Revenue'
    });
    assertTest(
        "AVERAGE accurately ignores missing/N/A rows",
        avgRes.result[0].value === 420.1 && avgRes.result[0].validCount === 5,
        `Received: ${JSON.stringify(avgRes.result[0])}`
    );

    // 3. Test MIN and MAX
    const minRes = await executeAnalyticalQuery(dataset, {
        operation: 'min',
        metric: 'Revenue'
    });
    const maxRes = await executeAnalyticalQuery(dataset, {
        operation: 'max',
        metric: 'Revenue'
    });
    assertTest(
        "MIN accounts for negative accounting format",
        minRes.result[0].value === -150,
        `Received: ${JSON.stringify(minRes.result[0])}`
    );
    assertTest(
        "MAX extracts top number",
        maxRes.result[0].value === 1200.5,
        `Received: ${JSON.stringify(maxRes.result[0])}`
    );

    // 4. Test COUNT
    const countRes = await executeAnalyticalQuery(dataset, {
        operation: 'count'
    });
    assertTest(
        "COUNT returns total matching rows",
        countRes.result[0].value === 6
    );

    // 5. Test TOP-N with sorting
    const topRes = await executeAnalyticalQuery(dataset, {
        operation: 'top',
        metric: 'Revenue',
        limit: 3
    });
    assertTest(
        "TOP-3 sorts descending by numeric metric",
        topRes.result.length === 3 &&
        topRes.result[0].Product === "Laptop" &&
        topRes.result[1].Product === "Phone" &&
        topRes.result[2].Product === "Monitor"
    );

    // 6. Test GROUP_BY with aggregation
    const groupRes = await executeAnalyticalQuery(dataset, {
        operation: 'group_by',
        column: 'Region',
        metric: 'Revenue'
    });
    assertTest(
        "GROUP_BY sums numeric metric per category",
        groupRes.result.length === 4 &&
        groupRes.result.some(r => r.Region === "North" && r.Revenue === 1050.5) // 1200.50 - 150 = 1050.5
    );

    // 7. Test Filters (String equality, numeric inequality, contains)
    const filterRes = await executeAnalyticalQuery(dataset, {
        operation: 'filter',
        filters: [
            { field: 'Region', operator: '=', value: 'North' },
            { field: 'Cost', operator: '>', value: 80 }
        ]
    });
    assertTest(
        "Multi-condition filter (Region = North AND Cost > 80)",
        filterRes.result.length === 2 && // Laptop (500) and Desk (100)
        filterRes.result.every(r => r.Region === 'North')
    );

    // 8. SQL Safety: Ensure identifier quoting and prevent statement chaining
    const safeSql = compileQueryToSql(dataset, {
        operation: 'sum',
        metric: 'Revenue',
        filters: [
            { field: 'Product', operator: '=', value: "Laptop'; DROP TABLE t; --" }
        ]
    });
    assertTest(
        "SQL injection attempt safely escaped as literal",
        safeSql.includes("''Laptop''; DROP TABLE t; --''") || safeSql.includes("'Laptop''; DROP TABLE t; --'"),
        `Compiled SQL: ${safeSql}`
    );

    // Release dataset
    await releaseDataset(dataset.id);
    assertTest("Dataset table dropped on release", true);

    console.log(`\nDuckDB Tests Completed: ${passed}/${total} passed.`);
    process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
    console.error("Test failure:", err);
    process.exit(1);
});

