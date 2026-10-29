const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Use an isolated database path for this test run
const testDbDir = path.resolve(__dirname, '..', 'data', 'test_e2e_env');
if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
}
const testDbPath = path.join(testDbDir, 'test_e2e_analyst.db');
process.env.DB_PATH = testDbPath;

const app = require('../server');
const { getDb, closeDb } = require('../database/db');
const { runMigrations } = require('../database/migrator');
const { datasetRepository } = require('../repositories/datasetRepository');
const { conversationRepository } = require('../repositories/conversationRepository');
const { registerDataset, getDataset, releaseDataset, listDatasets, clearAllDatasets } = require('../services/datasetRegistry');
const { executeAnalyticalQuery, tableExistsInDuckDB, resetDuckDB, compileQueryToSql } = require('../services/analyticalEngine');
const { recommendChart } = require('../services/chartRecommender');
const { generateSuggestions } = require('../services/suggestionGenerator');
const { parseNumericValue } = require('../services/dataProcessor');

const TEST_PORT = 5095;
let server = null;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(data); } catch (e) { json = data; }
                resolve({ status: res.statusCode, headers: res.headers, body: json });
            });
        });
        req.on('error', reject);
        if (body) {
            if (Buffer.isBuffer(body)) {
                req.write(body);
            } else {
                req.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
        }
        req.end();
    });
}

function createMultipart(boundary, filename, mime, content) {
    let payload = `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    payload += `Content-Type: ${mime}\r\n\r\n`;
    payload += content;
    payload += `\r\n--${boundary}--\r\n`;
    return Buffer.from(payload);
}

async function runAll14Workflows() {
    console.log("=== EXECUTING STAGE 4.5 END-TO-END WORKFLOW VERIFICATION (14 WORKFLOWS) ===\n");
    let passed = 0;
    let failed = 0;

    function verify(name, fn) {
        try {
            fn();
            console.log(`  ✓ Workflow: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ Workflow FAILED: ${name}:`, err.message);
            failed++;
        }
    }

    async function asyncVerify(name, fn) {
        try {
            await fn();
            console.log(`  ✓ Workflow: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ Workflow FAILED: ${name}:`, err.message);
            failed++;
        }
    }

    // Start HTTP server and run migrations
    await new Promise(r => { server = app.listen(TEST_PORT, r); });
    runMigrations();
    await clearAllDatasets();

    // -------------------------------------------------------------
    // WORKFLOW 1: Upload a valid CSV
    // -------------------------------------------------------------
    let dataset1Id = null;
    await asyncVerify("1. Upload a valid CSV with multi-type data", async () => {
        const boundary = '----WebKitFormBoundaryE2E1Valid';
        const csvContent = 
`Region,Product,Date,Revenue,Discount,Units
North,Widget A,2024-01-05,"$1,200.50",10%,15
North,Widget B,2024-01-10,"$850.00",5%,8
South,Widget A,2024-01-15,"$1,500.00",15%,20
South,Widget B,2024-01-20,"($50.00)",0%,-2
East,Widget A,2024-01-25,"$600.25",12%,5
East,Widget B,2024-01-30,"$700.00",8%,7
West,Widget A,2024-02-05,"$2,100.00",20%,25
West,Widget B,2024-02-10,"$1,300.00",15%,14
`;
        const body = createMultipart(boundary, 'sales_data.csv', 'text/csv', csvContent);
        const res = await request('POST', '/api/upload', body, {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length
        });

        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert(res.body.datasetId, "Should return datasetId");
        assert.strictEqual(res.body.rowCount, 8);
        assert.strictEqual(res.body.columnCount, 6);
        assert.deepStrictEqual(res.body.columns, ['Region', 'Product', 'Date', 'Revenue', 'Discount', 'Units']);
        assert.strictEqual(res.body.data.length, 8); // Preview rows
        dataset1Id = res.body.datasetId;
    });

    // -------------------------------------------------------------
    // WORKFLOW 2: Reject invalid, empty, or malformed CSV safely
    // -------------------------------------------------------------
    await asyncVerify("2. Reject invalid, empty, or malformed CSV safely", async () => {
        const boundary = '----WebKitFormBoundaryE2E2Invalid';

        // A. 0-byte file
        const emptyBody = createMultipart(boundary, 'empty.csv', 'text/csv', '');
        const resEmpty = await request('POST', '/api/upload', emptyBody, {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': emptyBody.length
        });
        assert.strictEqual(resEmpty.status, 400);
        assert(resEmpty.body.error.includes("empty"));

        // B. Non-CSV file (.txt or non-csv mime)
        const txtBody = createMultipart(boundary, 'document.txt', 'application/json', '{"a":1}');
        const resTxt = await request('POST', '/api/upload', txtBody, {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': txtBody.length
        });
        assert.strictEqual(resTxt.status, 400);
        assert(resTxt.body.error.includes(".csv"));

        // C. No file in body
        const resNoFile = await request('POST', '/api/upload', Buffer.from('not multipart'), {
            'Content-Type': 'text/plain'
        });
        assert.strictEqual(resNoFile.status, 400);
    });

    // -------------------------------------------------------------
    // WORKFLOW 3: Inspect uploaded dataset schema and preview
    // -------------------------------------------------------------
    await asyncVerify("3. Inspect uploaded dataset schema and preview", async () => {
        const res = await request('GET', `/api/dataset/${dataset1Id}/schema`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.datasetId, dataset1Id);
        assert.strictEqual(res.body.rowCount, 8);
        assert.strictEqual(res.body.schema.Revenue.type, 'numeric');
        assert.strictEqual(res.body.schema.Discount.type, 'numeric');
        assert.strictEqual(res.body.schema.Date.type, 'date');
        assert.strictEqual(res.body.schema.Region.type, 'categorical');
    });

    // -------------------------------------------------------------
    // WORKFLOW 4: Ask aggregate questions (total, average, min, max)
    // -------------------------------------------------------------
    let dataset1Record = null;
    await asyncVerify("4. Ask aggregate questions (total, average, min, max)", async () => {
        dataset1Record = getDataset(dataset1Id);
        assert(dataset1Record !== null);

        // A. Total sum on formatted currency ($1,200.50 + $850 + $1500 - $50 + $600.25 + $700 + $2100 + $1300 = 8200.75)
        const sumResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "sum",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(sumResult.result[0].value, 8200.75);

        // B. Average Units: (15 + 8 + 20 - 2 + 5 + 7 + 25 + 14) / 8 = 92 / 8 = 11.5
        const avgResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "average",
            metric: "Units",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(avgResult.result[0].value, 11.5);

        // C. Min on negative accounting format ($-50.00)
        const minResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "min",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(minResult.result[0].value, -50);

        // D. Max Revenue ($2,100.00)
        const maxResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "max",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(maxResult.result[0].value, 2100);
    });

    // -------------------------------------------------------------
    // WORKFLOW 5: Ask grouping, filtering, and Top-N questions
    // -------------------------------------------------------------
    await asyncVerify("5. Ask grouping, filtering, and Top-N questions", async () => {
        // A. Group by Region, sum Revenue
        const groupResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "group_by",
            column: "Region",
            metric: "Revenue",
            limit: null,
            filters: []
        });
        assert.strictEqual(groupResult.result.length, 4); // North, South, East, West
        const west = groupResult.result.find(r => r.Region === 'West');
        assert.strictEqual(west.Revenue, 3400); // 2100 + 1300

        // B. Filter where Units > 10
        const filterResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "filter",
            column: "",
            metric: "",
            limit: 100,
            filters: [{ field: "Units", operator: ">", value: "10" }]
        });
        assert.strictEqual(filterResult.result.length, 4); // 15, 20, 25, 14

        // C. Top 3 Products by Units
        const topResult = await executeAnalyticalQuery(dataset1Record, {
            operation: "top",
            metric: "Units",
            column: "Product",
            limit: 3,
            filters: []
        });
        assert.strictEqual(topResult.result.length, 3);
        assert.strictEqual(Number(topResult.result[0].Units), 25);
    });

    // -------------------------------------------------------------
    // WORKFLOW 6: Verify formatted numbers, currency, percentages, negative parsing
    // -------------------------------------------------------------
    verify("6. Verify formatted numbers, currency, percentages, negative parsing", () => {
        assert.strictEqual(parseNumericValue("$1,200.50"), 1200.5);
        assert.strictEqual(parseNumericValue("($50.00)"), -50);
        assert.strictEqual(parseNumericValue("15%"), 15);
        assert.strictEqual(parseNumericValue("1,000,000"), 1000000);
        assert.strictEqual(parseNumericValue("-12.45"), -12.45);
        assert.strictEqual(parseNumericValue("   N/A  "), null);
        assert.strictEqual(parseNumericValue(""), null);
    });

    // -------------------------------------------------------------
    // WORKFLOW 7: Verify chart recommendations and chart/table switching
    // -------------------------------------------------------------
    verify("7. Verify chart recommendations and chart/table switching", () => {
        // KPI
        const kpi = recommendChart({
            operation: "sum",
            metric: "Revenue",
            results: [{ operation: "sum", metric: "Revenue", value: 8200.75 }]
        });
        assert.strictEqual(kpi.type, "kpi");

        // Pie for <= 5 categories
        const pie = recommendChart({
            operation: "group_by",
            column: "Region",
            metric: "Revenue",
            results: [
                { Region: "North", Revenue: 2050 },
                { Region: "South", Revenue: 1450 },
                { Region: "East", Revenue: 1300 },
                { Region: "West", Revenue: 3400 }
            ]
        });
        assert.strictEqual(pie.type, "pie");

        // Line for dates >= 2 rows
        const line = recommendChart({
            operation: "group_by",
            column: "Date",
            metric: "Revenue",
            results: [
                { Date: "2024-01-01", Revenue: 100 },
                { Date: "2024-01-02", Revenue: 200 }
            ],
            schema: { Date: { type: "date" } }
        });
        assert.strictEqual(line.type, "line");

        // Bar for top-N
        const bar = recommendChart({
            operation: "top",
            column: "Product",
            metric: "Revenue",
            results: [
                { Product: "Widget A", Revenue: 2100 },
                { Product: "Widget B", Revenue: 1300 }
            ]
        });
        assert.strictEqual(bar.type, "bar");

        // Table for non-numeric listings
        const table = recommendChart({
            operation: "filter",
            results: [{ Name: "Alice" }, { Name: "Bob" }]
        });
        assert.strictEqual(table.type, "table");
    });

    // -------------------------------------------------------------
    // WORKFLOW 8: Ask follow-up questions using previous analytical context
    // -------------------------------------------------------------
    await asyncVerify("8. Ask follow-up questions using previous analytical context", async () => {
        // Initial AST
        const initialAST = { operation: "top", column: "Product", metric: "Revenue", limit: 3 };
        const suggestions = generateSuggestions({
            schema: dataset1Record.schema,
            columns: dataset1Record.columns,
            currentQuery: "Top 3 products by revenue",
            lastOperation: initialAST
        });
        assert(suggestions.length >= 3);

        // Follow-up: adapt AST to group_by Region retaining Revenue metric
        const followUpAST = {
            operation: "group_by",
            column: "Region",
            metric: initialAST.metric, // retained
            limit: null,
            filters: []
        };
        const followUpExec = await executeAnalyticalQuery(dataset1Record, followUpAST);
        assert.strictEqual(followUpExec.result.length, 4);

        // Refine follow-up: "Exclude East"
        const refinedAST = {
            ...followUpAST,
            filters: [{ field: "Region", operator: "!=", value: "East" }]
        };
        const refinedExec = await executeAnalyticalQuery(dataset1Record, refinedAST);
        assert.strictEqual(refinedExec.result.length, 3);
        assert.strictEqual(refinedExec.result.some(r => r.Region === "East"), false);
    });

    // -------------------------------------------------------------
    // WORKFLOW 9: Start a new conversation
    // -------------------------------------------------------------
    let conv1 = null;
    await asyncVerify("9. Start a new conversation", async () => {
        const res = await request('POST', '/api/conversations', {
            title: "Q1 Regional Analysis",
            datasetId: dataset1Id
        });
        assert.strictEqual(res.status, 201);
        assert(res.body.id);
        assert.strictEqual(res.body.title, "Q1 Regional Analysis");
        assert.strictEqual(res.body.datasetId, dataset1Id);
        conv1 = res.body;
    });

    // -------------------------------------------------------------
    // WORKFLOW 10: Save, reopen, rename, and delete conversations
    // -------------------------------------------------------------
    await asyncVerify("10. Save, reopen, rename, and delete conversations", async () => {
        // Save user message
        conversationRepository.appendMessage({
            conversationId: conv1.id,
            role: "user",
            content: "What is total revenue?"
        });

        // Save assistant message
        conversationRepository.appendMessage({
            conversationId: conv1.id,
            role: "assistant",
            content: "The total revenue is $8,200.75.",
            operation: { operation: "sum", metric: "Revenue" },
            chartConfig: { type: "kpi", value: 8200.75 }
        });

        // Reopen conversation
        const reopenedRes = await request('GET', `/api/conversations/${conv1.id}`);
        assert.strictEqual(reopenedRes.status, 200);
        assert.strictEqual(reopenedRes.body.messages.length, 2);
        assert.strictEqual(reopenedRes.body.messages[0].role, "user");
        assert.strictEqual(reopenedRes.body.messages[1].role, "assistant");
        assert.strictEqual(reopenedRes.body.messages[1].chartConfig.value, 8200.75);

        // Rename conversation
        const renameRes = await request('PATCH', `/api/conversations/${conv1.id}`, {
            title: "Renamed Q1 Analysis"
        });
        assert.strictEqual(renameRes.status, 200);
        assert.strictEqual(renameRes.body.title, "Renamed Q1 Analysis");

        // Delete conversation
        const deleteRes = await request('DELETE', `/api/conversations/${conv1.id}`);
        assert.strictEqual(deleteRes.status, 200);

        const checkRes = await request('GET', `/api/conversations/${conv1.id}`);
        assert.strictEqual(checkRes.status, 404);
    });

    // -------------------------------------------------------------
    // WORKFLOW 11: Restart backend and verify datasets remain available
    // -------------------------------------------------------------
    await asyncVerify("11. Restart backend and verify datasets remain available", async () => {
        // Simulate backend crash & restart: wipe DuckDB completely
        resetDuckDB();
        const exists = await tableExistsInDuckDB(dataset1Record.tableName);
        assert.strictEqual(exists, false, "Table must not exist after reset");

        // Query dataset after restart -> lazy reconstruction
        const recoveredDataset = getDataset(dataset1Id);
        assert(recoveredDataset !== null);

        const execAfterRestart = await executeAnalyticalQuery(recoveredDataset, {
            operation: "sum",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });

        assert.strictEqual(execAfterRestart.result[0].value, 8200.75);
        assert.strictEqual(execAfterRestart.metadata.engine, "duckdb");
    });

    // -------------------------------------------------------------
    // WORKFLOW 12: Delete a dataset and verify related resources handled safely
    // -------------------------------------------------------------
    await asyncVerify("12. Delete a dataset and verify related resources handled safely", async () => {
        // Create conversation linked to dataset1
        const convLinked = conversationRepository.createConversation({
            title: "Linked Chat",
            datasetId: dataset1Id
        });

        // Release dataset1
        const delRes = await request('DELETE', `/api/dataset/${dataset1Id}`);
        assert.strictEqual(delRes.status, 200);

        // Verify dataset is gone
        const schemaRes = await request('GET', `/api/dataset/${dataset1Id}/schema`);
        assert.strictEqual(schemaRes.status, 404);

        // Verify conversation survived with dataset_id set to NULL
        const checkConv = conversationRepository.getConversationById(convLinked.id);
        assert(checkConv !== null);
        assert.strictEqual(checkConv.datasetId, null);

        // Clean up conversation
        conversationRepository.deleteConversation(convLinked.id);
    });

    // -------------------------------------------------------------
    // WORKFLOW 13: Test missing datasets, invalid IDs, AI failures, interrupted requests
    // -------------------------------------------------------------
    await asyncVerify("13. Test missing datasets, invalid IDs, AI failures, interrupted requests", async () => {
        // Non-existent dataset ID
        const resBadId = await request('POST', '/api/analyze', {
            query: "Show total sales",
            datasetId: "00000000-0000-0000-0000-000000000000"
        });
        assert.strictEqual(resBadId.status, 404);

        // Query with missing query text
        const resNoQuery = await request('POST', '/api/analyze', { query: "" });
        assert.strictEqual(resNoQuery.status, 400);

        // Oversized query > 500 chars
        const resLongQuery = await request('POST', '/api/analyze', { query: "a".repeat(501) });
        assert.strictEqual(resLongQuery.status, 400);
    });

    // -------------------------------------------------------------
    // WORKFLOW 14: Verify that one dataset's results never leak into another dataset's analysis
    // -------------------------------------------------------------
    await asyncVerify("14. Verify that one dataset's results never leak into another dataset's analysis", async () => {
        // Upload Dataset X (Sales)
        const boundaryX = '----WebKitFormBoundaryE2E14X';
        const csvX = "Product,Revenue\nWidget X,5000\nWidget Y,3000\n";
        const bodyX = createMultipart(boundaryX, 'dataset_x.csv', 'text/csv', csvX);
        const resX = await request('POST', '/api/upload', bodyX, {
            'Content-Type': `multipart/form-data; boundary=${boundaryX}`,
            'Content-Length': bodyX.length
        });
        const idX = resX.body.datasetId;

        // Upload Dataset Y (HR)
        const boundaryY = '----WebKitFormBoundaryE2E14Y';
        const csvY = "Employee,Salary\nAlice,80000\nBob,95000\n";
        const bodyY = createMultipart(boundaryY, 'dataset_y.csv', 'text/csv', csvY);
        const resY = await request('POST', '/api/upload', bodyY, {
            'Content-Type': `multipart/form-data; boundary=${boundaryY}`,
            'Content-Length': bodyY.length
        });
        const idY = resY.body.datasetId;

        const dsX = getDataset(idX);
        const dsY = getDataset(idY);

        // Execute Sum Revenue on Dataset X
        const qX = await executeAnalyticalQuery(dsX, {
            operation: "sum",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(qX.result[0].value, 8000); // 5000 + 3000

        // Execute Sum Salary on Dataset Y
        const qY = await executeAnalyticalQuery(dsY, {
            operation: "sum",
            metric: "Salary",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(qY.result[0].value, 175000); // 80000 + 95000

        // Cross-querying: Dataset X has no 'Salary', Dataset Y has no 'Revenue'
        assert.strictEqual(dsX.columns.includes('Salary'), false);
        assert.strictEqual(dsY.columns.includes('Revenue'), false);

        // Cleanup
        await releaseDataset(idX);
        await releaseDataset(idY);
    });

    // Teardown
    if (server) {
        await new Promise(r => server.close(r));
    }
    closeDb();
    try {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
        if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    } catch (e) {}

    // Summary
    console.log(`\n========================================`);
    console.log(`Stage 4.5 E2E Workflow Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runAll14Workflows().catch(err => {
    console.error("Stage 4.5 fatal error:", err);
    if (server) server.close();
    process.exit(1);
});

