const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { recommendChart } = require('../services/chartRecommender');
const { generateSuggestions } = require('../services/suggestionGenerator');
const { convertQueryToJson } = require('../services/queryParser');
const { registerDataset, getDataset, releaseDataset } = require('../services/datasetRegistry');
const { profileDataset } = require('../services/schemaProfiler');
const { executeAnalyticalQuery } = require('../services/analyticalEngine');

async function runStage3Tests() {
    console.log("=== RUNNING STAGE 3 CONVERSATIONAL & DYNAMIC VISUALIZATION TESTS ===\n");
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}:`, err.message);
            failed++;
        }
    }

    async function asyncTest(name, fn) {
        try {
            await fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}:`, err.message);
            failed++;
        }
    }

    // --- TEST GROUP 1: Chart Recommender ---
    console.log("[Group 1: Deterministic Chart Recommender]");

    test("Recommends KPI for single aggregate result (sum)", () => {
        const recommendation = recommendChart({
            operation: "sum",
            metric: "Sales",
            results: [{ operation: "sum", metric: "Sales", value: 125000, validCount: 42 }],
            schema: { Sales: { type: "numeric" } }
        });
        assert.strictEqual(recommendation.type, "kpi");
        assert.strictEqual(recommendation.value, 125000);
        assert.strictEqual(recommendation.validCount, 42);
    });

    test("Recommends PIE chart for small categorical breakdown (<= 5 rows, group_by)", () => {
        const recommendation = recommendChart({
            operation: "group_by",
            column: "Region",
            metric: "Revenue",
            results: [
                { Region: "North", Revenue: 3000 },
                { Region: "South", Revenue: 4500 },
                { Region: "East", Revenue: 2500 }
            ],
            schema: { Region: { type: "text" }, Revenue: { type: "numeric" } }
        });
        assert.strictEqual(recommendation.type, "pie");
        assert.strictEqual(recommendation.xKey, "Region");
        assert.strictEqual(recommendation.yKey, "Revenue");
    });

    test("Recommends BAR chart for Top-N operations", () => {
        const recommendation = recommendChart({
            operation: "top",
            column: "Product",
            metric: "Sales",
            results: [
                { Product: "Widget A", Sales: 900 },
                { Product: "Widget B", Sales: 750 },
                { Product: "Widget C", Sales: 500 }
            ],
            schema: { Product: { type: "text" }, Sales: { type: "numeric" } }
        });
        assert.strictEqual(recommendation.type, "bar");
        assert.strictEqual(recommendation.xKey, "Product");
        assert.strictEqual(recommendation.yKey, "Sales");
    });

    test("Recommends LINE chart for temporal date series (>= 2 rows)", () => {
        const recommendation = recommendChart({
            operation: "group_by",
            column: "OrderDate",
            metric: "Sales",
            results: [
                { OrderDate: "2024-01-01", Sales: 100 },
                { OrderDate: "2024-01-02", Sales: 150 },
                { OrderDate: "2024-01-03", Sales: 120 }
            ],
            schema: { OrderDate: { type: "date" }, Sales: { type: "numeric" } }
        });
        assert.strictEqual(recommendation.type, "line");
        assert.strictEqual(recommendation.xKey, "OrderDate");
        assert.strictEqual(recommendation.yKey, "Sales");
    });

    test("Recommends AREA chart for long temporal date series (> 10 points)", () => {
        const results = Array.from({ length: 15 }, (_, i) => ({
            OrderDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
            Sales: 100 + i * 10
        }));
        const recommendation = recommendChart({
            operation: "group_by",
            column: "OrderDate",
            metric: "Sales",
            results: results,
            schema: { OrderDate: { type: "date" }, Sales: { type: "numeric" } }
        });
        assert.strictEqual(recommendation.type, "area");
    });

    test("Recommends TABLE for non-numeric or raw record lists", () => {
        const recommendation = recommendChart({
            operation: "filter",
            results: [
                { Name: "Alice", Email: "alice@example.com" },
                { Name: "Bob", Email: "bob@example.com" }
            ],
            schema: { Name: { type: "text" }, Email: { type: "text" } }
        });
        assert.strictEqual(recommendation.type, "table");
    });

    // --- TEST GROUP 2: Grounded Follow-up Suggestions ---
    console.log("\n[Group 2: Grounded Follow-up Suggestions]");

    test("Generates 3-4 suggestions grounded in dataset schema columns", () => {
        const schema = {
            Region: { type: "text" },
            Sales: { type: "numeric" },
            OrderDate: { type: "date" }
        };
        const suggestions = generateSuggestions({
            schema: schema,
            columns: ["Region", "Sales", "OrderDate"],
            currentQuery: "Show total sales",
            lastOperation: { operation: "sum", metric: "Sales" }
        });

        assert(Array.isArray(suggestions));
        assert(suggestions.length >= 3 && suggestions.length <= 4, `Expected 3-4 suggestions, got ${suggestions.length}`);
        
        // Every suggestion should reference either Region, Sales, or OrderDate
        const allReferenceKnownCols = suggestions.every(s => 
            s.includes("Sales") || s.includes("Region") || s.includes("OrderDate")
        );
        assert(allReferenceKnownCols, "Suggestions must reference known dataset columns");
    });

    test("Suggests contextual category switch for group_by operation", () => {
        const schema = {
            Region: { type: "text" },
            Category: { type: "text" },
            Sales: { type: "numeric" }
        };
        const suggestions = generateSuggestions({
            schema: schema,
            columns: ["Region", "Category", "Sales"],
            currentQuery: "Sales by region",
            lastOperation: { operation: "group_by", column: "Region", metric: "Sales" }
        });

        assert(suggestions.some(s => s.toLowerCase().includes("category")), "Should suggest grouping by secondary category");
    });

    // --- TEST GROUP 3: Multi-turn Analytical Execution in DuckDB ---
    console.log("\n[Group 3: Multi-turn Analytical Pipeline in DuckDB]");

    const testCsvPath = path.resolve(__dirname, 'test-conversation-data.csv');
    fs.writeFileSync(testCsvPath, 
`Region,Product,Sales,Quantity,Date
North,Widget A,1200,10,2024-01-05
North,Widget B,850,5,2024-01-10
South,Widget A,1500,12,2024-01-12
South,Widget B,950,8,2024-01-15
East,Widget A,600,4,2024-01-18
East,Widget B,700,6,2024-01-20
West,Widget A,2100,15,2024-01-22
West,Widget B,1300,9,2024-01-25
`);

    const mockRows = [
        { Region: 'North', Product: 'Widget A', Sales: '1200', Quantity: '10', Date: '2024-01-05' },
        { Region: 'North', Product: 'Widget B', Sales: '850', Quantity: '5', Date: '2024-01-10' },
        { Region: 'South', Product: 'Widget A', Sales: '1500', Quantity: '12', Date: '2024-01-12' },
        { Region: 'South', Product: 'Widget B', Sales: '950', Quantity: '8', Date: '2024-01-15' },
        { Region: 'East', Product: 'Widget A', Sales: '600', Quantity: '4', Date: '2024-01-18' },
        { Region: 'East', Product: 'Widget B', Sales: '700', Quantity: '6', Date: '2024-01-20' },
        { Region: 'West', Product: 'Widget A', Sales: '2100', Quantity: '15', Date: '2024-01-22' },
        { Region: 'West', Product: 'Widget B', Sales: '1300', Quantity: '9', Date: '2024-01-25' }
    ];

    let dataset = null;

    await asyncTest("Register isolated dataset with DuckDB table", async () => {
        dataset = await registerDataset({
            filename: "test-conversation-data.csv",
            filePath: testCsvPath,
            rows: mockRows
        });
        assert(dataset && dataset.id, "Dataset should be registered with UUID");
    });

    await asyncTest("Turn 1: Initial query 'Total Sales'", async () => {
        const turn1Query = {
            operation: "sum",
            metric: "Sales",
            column: "",
            limit: null,
            filters: []
        };
        const execution = await executeAnalyticalQuery(dataset, turn1Query);
        assert.strictEqual(execution.result[0].value, 9200); // 1200+850+1500+950+600+700+2100+1300 = 9200
        assert.strictEqual(execution.metadata.engine, "duckdb");
    });

    await asyncTest("Turn 2: Follow-up query 'Now break that down by region'", async () => {
        // Follow-up retains metric 'Sales' and adapts operation to group_by with column 'Region'
        const turn2Query = {
            operation: "group_by",
            metric: "Sales",
            column: "Region",
            limit: null,
            filters: []
        };
        const execution = await executeAnalyticalQuery(dataset, turn2Query);
        assert.strictEqual(execution.result.length, 4); // North, South, East, West
        
        const west = execution.result.find(r => r.Region === 'West');
        assert.strictEqual(west.Sales, 3400); // 2100 + 1300 = 3400

        const north = execution.result.find(r => r.Region === 'North');
        assert.strictEqual(north.Sales, 2050); // 1200 + 850 = 2050
    });

    await asyncTest("Turn 3: Follow-up query 'Exclude the East region'", async () => {
        // Retains group_by Region and Sales, but adds filter Region != East
        const turn3Query = {
            operation: "group_by",
            metric: "Sales",
            column: "Region",
            limit: null,
            filters: [
                { field: "Region", operator: "!=", value: "East" }
            ]
        };
        const execution = await executeAnalyticalQuery(dataset, turn3Query);
        assert.strictEqual(execution.result.length, 3); // North, South, West (East excluded)
        const hasEast = execution.result.some(r => r.Region === 'East');
        assert.strictEqual(hasEast, false);
    });

    await asyncTest("Cleanup: release dataset and remove temp csv", async () => {
        await releaseDataset(dataset.id);
        assert.strictEqual(getDataset(dataset.id), null);
        try { fs.unlinkSync(testCsvPath); } catch (e) {}
    });

    // Summary
    console.log(`\n========================================`);
    console.log(`Stage 3 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runStage3Tests().catch(err => {
    console.error("Stage 3 test suite fatal error:", err);
    process.exit(1);
});
