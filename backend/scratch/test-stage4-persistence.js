const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use an isolated temporary database for testing
const testDbDir = path.resolve(__dirname, '..', 'data', 'test_env');
if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
}
const testDbPath = path.join(testDbDir, 'test_analyst.db');
process.env.DB_PATH = testDbPath;

const { getDb, closeDb } = require('../database/db');
const { runMigrations } = require('../database/migrator');
const { datasetRepository } = require('../repositories/datasetRepository');
const { conversationRepository } = require('../repositories/conversationRepository');
const { registerDataset, getDataset, releaseDataset, listDatasets } = require('../services/datasetRegistry');
const { executeAnalyticalQuery, tableExistsInDuckDB, resetDuckDB } = require('../services/analyticalEngine');

async function runStage4Tests() {
    console.log("=== RUNNING STAGE 4 PERSISTENCE, CONVERSATION & LIFECYCLE TESTS ===\n");
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

    // --- TEST GROUP 1: Migrations & Database Setup ---
    console.log("[Group 1: SQLite Migrations & Schema Initialization]");

    test("Initializes SQLite database and runs versioned migrations", () => {
        const db = getDb(testDbPath);
        const applied = runMigrations(db);
        assert(Array.isArray(applied), "runMigrations should return applied list");

        // Verify tables exist
        const tables = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('datasets', 'conversations', 'messages', 'schema_migrations')"
        ).all().map(r => r.name);

        assert(tables.includes('datasets'), "datasets table must exist");
        assert(tables.includes('conversations'), "conversations table must exist");
        assert(tables.includes('messages'), "messages table must exist");
        assert(tables.includes('schema_migrations'), "schema_migrations table must exist");
    });

    test("Running migrations a second time is idempotent (0 new migrations)", () => {
        const db = getDb(testDbPath);
        const secondRun = runMigrations(db);
        assert.strictEqual(secondRun.length, 0, "Idempotent migration should apply 0 new files");
    });

    // --- TEST GROUP 2: Persistent Dataset Lifecycle & File Durability ---
    console.log("\n[Group 2: Persistent Dataset Management & Durability]");

    const sampleRows = [
        { Product: "Alpha", Category: "Tech", Revenue: "1500", Units: "10" },
        { Product: "Beta", Category: "Tech", Revenue: "2300", Units: "15" },
        { Product: "Gamma", Category: "Office", Revenue: "800", Units: "20" },
        { Product: "Delta", Category: "Office", Revenue: "1200", Units: "12" }
    ];

    let datasetA = null;

    await asyncTest("Registers dataset with SQLite metadata and durable CSV on disk", async () => {
        datasetA = await registerDataset({
            filename: "sales_q1.csv",
            rows: sampleRows,
            rawHeaders: ["Product", "Category", "Revenue", "Units"],
            userId: "user-alpha"
        });

        assert(datasetA && datasetA.id, "Dataset should have generated UUID");
        assert.strictEqual(datasetA.filename, "sales_q1.csv");
        assert.strictEqual(datasetA.rowCount, 4);

        // Verify stored in SQLite
        const dbRecord = datasetRepository.getDatasetById(datasetA.id);
        assert(dbRecord !== null, "Dataset record must exist in SQLite");
        assert.strictEqual(dbRecord.filename, "sales_q1.csv");
        assert.strictEqual(dbRecord.rowCount, 4);
        assert.deepStrictEqual(dbRecord.columns, ["Product", "Category", "Revenue", "Units"]);

        // Verify durable CSV exists on disk
        assert(fs.existsSync(datasetA.filePath), "Durable CSV file must exist on disk");
    });

    await asyncTest("Simulated backend restart: DuckDB table is reconstructed from durable CSV", async () => {
        // Step 1: Query before restart in DuckDB
        const q1 = await executeAnalyticalQuery(datasetA, {
            operation: "sum",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });
        assert.strictEqual(q1.result[0].value, 5800); // 1500+2300+800+1200

        // Step 2: Simulate backend restart: drop DuckDB instance completely
        resetDuckDB();
        const existsAfterWipe = await tableExistsInDuckDB(datasetA.tableName);
        assert.strictEqual(existsAfterWipe, false, "DuckDB table should not exist after simulated crash/restart");

        // Step 3: Call getDataset - should detect missing table and reconstruct from durable CSV
        const recoveredDataset = getDataset(datasetA.id);
        assert(recoveredDataset !== null, "Recovered dataset must be retrievable from SQLite");

        // Wait a tick for async reconstruction or trigger query
        const qAfterRestart = await executeAnalyticalQuery(recoveredDataset, {
            operation: "sum",
            metric: "Revenue",
            column: "",
            limit: null,
            filters: []
        });

        assert.strictEqual(qAfterRestart.result[0].value, 5800, "Calculated value must match after reconstruction");
        assert.strictEqual(qAfterRestart.metadata.engine, "duckdb", "Engine should be DuckDB after reconstruction");
    });

    // --- TEST GROUP 3: Saved Conversations & Multi-turn History ---
    console.log("\n[Group 3: Saved Conversations & Message History]");

    let conversation = null;

    test("Creates a new conversation linked to dataset", () => {
        conversation = conversationRepository.createConversation({
            title: "Q1 Revenue Analysis",
            datasetId: datasetA.id,
            userId: "user-alpha"
        });

        assert(conversation && conversation.id, "Conversation must have generated UUID");
        assert.strictEqual(conversation.title, "Q1 Revenue Analysis");
        assert.strictEqual(conversation.datasetId, datasetA.id);
        assert.strictEqual(conversation.userId, "user-alpha");
    });

    test("Appends ordered user and assistant messages with complete analytical metadata", () => {
        // Turn 1: User message
        const userMsg1 = conversationRepository.appendMessage({
            conversationId: conversation.id,
            role: "user",
            content: "What is the total revenue?"
        });
        assert.strictEqual(userMsg1.sequenceNumber, 1);
        assert.strictEqual(userMsg1.role, "user");

        // Turn 1: Assistant message
        const assistantMsg1 = conversationRepository.appendMessage({
            conversationId: conversation.id,
            role: "assistant",
            content: "The total revenue across all products is $5,800.",
            operation: { operation: "sum", metric: "Revenue" },
            chartConfig: { type: "kpi", value: 5800, metric: "Revenue" },
            transparency: { operation: "sum", metric: "Revenue", engine: "duckdb", rowCount: 1 },
            suggestions: ["Break down revenue by Category", "Top products by Revenue"]
        });
        assert.strictEqual(assistantMsg1.sequenceNumber, 2);
        assert.strictEqual(assistantMsg1.role, "assistant");

        // Turn 2: User follow-up message
        const userMsg2 = conversationRepository.appendMessage({
            conversationId: conversation.id,
            role: "user",
            content: "Now break that down by category."
        });
        assert.strictEqual(userMsg2.sequenceNumber, 3);

        // Turn 2: Assistant response
        const assistantMsg2 = conversationRepository.appendMessage({
            conversationId: conversation.id,
            role: "assistant",
            content: "Tech leads with $3,800, followed by Office with $2,000.",
            operation: { operation: "group_by", column: "Category", metric: "Revenue" },
            chartConfig: { type: "pie", xKey: "Category", yKey: "Revenue" },
            transparency: { operation: "group_by", column: "Category", metric: "Revenue", engine: "duckdb", rowCount: 2 },
            suggestions: ["Show top product in Tech", "Filter by Office"]
        });
        assert.strictEqual(assistantMsg2.sequenceNumber, 4);
    });

    test("Retrieves conversation with strictly ordered messages and preserved metadata", () => {
        const retrieved = conversationRepository.getConversationById(conversation.id);
        assert(retrieved !== null);
        assert.strictEqual(retrieved.messages.length, 4);

        // Sequence numbers strictly 1, 2, 3, 4
        assert.strictEqual(retrieved.messages[0].sequenceNumber, 1);
        assert.strictEqual(retrieved.messages[1].sequenceNumber, 2);
        assert.strictEqual(retrieved.messages[2].sequenceNumber, 3);
        assert.strictEqual(retrieved.messages[3].sequenceNumber, 4);

        // Turn 1 assistant metadata
        const ast1 = retrieved.messages[1];
        assert.strictEqual(ast1.chartConfig.type, "kpi");
        assert.strictEqual(ast1.transparency.engine, "duckdb");
        assert.strictEqual(ast1.suggestions.length, 2);

        // Turn 2 assistant metadata
        const ast2 = retrieved.messages[3];
        assert.strictEqual(ast2.chartConfig.type, "pie");
        assert.strictEqual(ast2.operation.operation, "group_by");
    });

    test("Updates conversation title (renaming)", () => {
        const updated = conversationRepository.updateConversationTitle(conversation.id, "Updated Q1 Overview", "user-alpha");
        assert.strictEqual(updated.title, "Updated Q1 Overview");
    });

    test("Lists conversations with message count", () => {
        const list = conversationRepository.listConversations("user-alpha");
        assert(list.length >= 1);
        const item = list.find(c => c.id === conversation.id);
        assert(item !== undefined);
        assert.strictEqual(item.messageCount, 4);
    });

    // --- TEST GROUP 4: Cascade & Cleanup ---
    console.log("\n[Group 4: Cascade Deletion & Resource Cleanup]");

    test("Deleting conversation cascades to all associated messages", () => {
        const deleted = conversationRepository.deleteConversation(conversation.id);
        assert.strictEqual(deleted, true);

        const convAfter = conversationRepository.getConversationById(conversation.id);
        assert.strictEqual(convAfter, null);

        const msgsAfter = conversationRepository.getMessages(conversation.id);
        assert.strictEqual(msgsAfter.length, 0, "Messages must be deleted via cascade");
    });

    await asyncTest("Releasing dataset drops table, removes durable CSV, and deletes DB record", async () => {
        const filePath = datasetA.filePath;
        const tableName = datasetA.tableName;

        const released = await releaseDataset(datasetA.id);
        assert.strictEqual(released, true);

        // Verify SQLite record removed
        const record = datasetRepository.getDatasetById(datasetA.id);
        assert.strictEqual(record, null);

        // Verify durable CSV file removed
        assert.strictEqual(fs.existsSync(filePath), false, "Durable CSV must be unlinked on dataset release");

        // Verify DuckDB table dropped
        const tableStillExists = await tableExistsInDuckDB(tableName);
        assert.strictEqual(tableStillExists, false, "DuckDB table must be dropped on dataset release");
    });

    // --- TEST GROUP 5: Multi-user Ownership Readiness ---
    console.log("\n[Group 5: Multi-user Ownership Scoping]");

    await asyncTest("Dataset and conversation operations respect user scoping", async () => {
        const datasetBeta = await registerDataset({
            filename: "private_hr.csv",
            rows: [{ Employee: "John", Salary: "90000" }],
            userId: "user-beta"
        });

        const convBeta = conversationRepository.createConversation({
            title: "Beta Private Thread",
            datasetId: datasetBeta.id,
            userId: "user-beta"
        });

        // User Alpha cannot access User Beta's dataset or conversation when userId is checked
        const alphaAccessDataset = datasetRepository.getDatasetById(datasetBeta.id, "user-alpha");
        assert.strictEqual(alphaAccessDataset, null, "User Alpha must not access User Beta's dataset");

        const alphaAccessConv = conversationRepository.getConversationById(convBeta.id, "user-alpha");
        assert.strictEqual(alphaAccessConv, null, "User Alpha must not access User Beta's conversation");

        // User Beta can access their own
        const betaAccessConv = conversationRepository.getConversationById(convBeta.id, "user-beta");
        assert(betaAccessConv !== null);

        // Cleanup
        await releaseDataset(datasetBeta.id, "user-beta");
        conversationRepository.deleteConversation(convBeta.id, "user-beta");
    });

    // --- TEST GROUP 6: HTTP Conversation API Endpoints ---
    console.log("\n[Group 6: HTTP Conversation REST Endpoints]");

    const http = require('http');
    const app = require('../server');
    const HTTP_PORT = 5092;
    let httpServer = null;

    function request(method, path, body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: HTTP_PORT,
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
                    try { json = JSON.parse(data); } catch(e) { json = data; }
                    resolve({ status: res.statusCode, body: json });
                });
            });
            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    await asyncTest("Start test HTTP server", async () => {
        await new Promise((resolve) => {
            httpServer = app.listen(HTTP_PORT, () => resolve());
        });
    });

    let httpConvId = null;

    await asyncTest("POST /api/conversations creates new conversation thread (201)", async () => {
        const res = await request('POST', '/api/conversations', { title: "API Test Thread" });
        assert.strictEqual(res.status, 201);
        assert(res.body.id);
        assert.strictEqual(res.body.title, "API Test Thread");
        httpConvId = res.body.id;
    });

    await asyncTest("GET /api/conversations lists existing threads (200)", async () => {
        const res = await request('GET', '/api/conversations');
        assert.strictEqual(res.status, 200);
        assert(Array.isArray(res.body.conversations));
        const found = res.body.conversations.find(c => c.id === httpConvId);
        assert(found !== undefined);
    });

    await asyncTest("GET /api/conversations/:id returns thread with message history (200)", async () => {
        const res = await request('GET', `/api/conversations/${httpConvId}`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.id, httpConvId);
        assert(Array.isArray(res.body.messages));
    });

    await asyncTest("PATCH /api/conversations/:id renames thread (200)", async () => {
        const res = await request('PATCH', `/api/conversations/${httpConvId}`, { title: "Renamed Thread" });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.title, "Renamed Thread");
    });

    await asyncTest("DELETE /api/conversations/:id removes thread (200)", async () => {
        const res = await request('DELETE', `/api/conversations/${httpConvId}`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);

        // Fetching deleted conversation returns 404
        const check = await request('GET', `/api/conversations/${httpConvId}`);
        assert.strictEqual(check.status, 404);
    });

    await asyncTest("Close test HTTP server", async () => {
        if (httpServer) {
            await new Promise(r => httpServer.close(r));
        }
    });

    // Teardown test database
    closeDb();
    try {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        const shm = testDbPath + '-shm';
        const wal = testDbPath + '-wal';
        if (fs.existsSync(shm)) fs.unlinkSync(shm);
        if (fs.existsSync(wal)) fs.unlinkSync(wal);
    } catch (e) {}

    // Summary
    console.log(`\n========================================`);
    console.log(`Stage 4 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runStage4Tests().catch(err => {
    console.error("Stage 4 test suite fatal error:", err);
    process.exit(1);
});
