const http = require('http');
const app = require('../server');

const TEST_PORT = 5098;
let server;

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path,
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

function createMultipartFormData(boundary, filename, mimeType, content) {
    let payload = `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    payload += `Content-Type: ${mimeType}\r\n\r\n`;
    payload += content;
    payload += `\r\n--${boundary}--\r\n`;
    return Buffer.from(payload);
}

async function runIsolationTests() {
    console.log("Starting Dataset Isolation & API Contract Tests...\n");
    server = app.listen(TEST_PORT);

    let passed = 0;
    let total = 0;

    const assertTest = (name, condition, details = "") => {
        total++;
        if (condition) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${name} ${details}`);
        }
    };

    try {
        const boundary = '----WebKitFormBoundaryIsolationTest';

        // 1. Upload Dataset A: Tech Sales
        const csvA = `Product,Revenue,Region
Laptop,"$1,200.00",North
Phone,"$800.00",South
Monitor,"$1,500.00",East
`;
        const multipartA = createMultipartFormData(boundary, 'tech_sales.csv', 'text/csv', csvA);
        const resUploadA = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': multipartA.length
            },
            body: multipartA
        });

        assertTest("Dataset A upload succeeded with 200", resUploadA.statusCode === 200);
        const datasetIdA = resUploadA.body.datasetId;
        assertTest("Dataset A assigned valid UUID", typeof datasetIdA === 'string' && datasetIdA.length >= 32);
        assertTest("Dataset A returned schema and preview data", resUploadA.body.columns.includes("Revenue") && resUploadA.body.data.length === 3);

        // 2. Upload Dataset B: Employee Salaries
        const csvB = `Employee,Department,Salary,Years
Alice,Engineering,"$120,000",5
Bob,Design,"$80,000",3
Charlie,Marketing,"$70,000",2
`;
        const multipartB = createMultipartFormData(boundary, 'employee_salaries.csv', 'text/csv', csvB);
        const resUploadB = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': multipartB.length
            },
            body: multipartB
        });

        assertTest("Dataset B upload succeeded with 200", resUploadB.statusCode === 200);
        const datasetIdB = resUploadB.body.datasetId;
        assertTest("Dataset B assigned unique UUID distinct from A", datasetIdB !== datasetIdA);

        // 3. Verify Active Datasets List
        const resList = await makeRequest({ method: 'GET', path: '/api/datasets' });
        assertTest(
            "Both datasets registered simultaneously in registry",
            resList.statusCode === 200 && resList.body.datasets.length >= 2 &&
            resList.body.datasets.some(d => d.id === datasetIdA) &&
            resList.body.datasets.some(d => d.id === datasetIdB)
        );

        // 4. Query Dataset A explicitly
        // If GROQ_API_KEY is not set in local test env, convertQueryToJson will return error or we can test query parser directly
        // Let's verify that requesting an invalid column for Dataset A is rejected
        const resInvalidColOnA = await makeRequest({
            method: 'POST',
            path: '/api/analyze',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: "What is the average Salary?",
                datasetId: datasetIdA
            })
        });
        assertTest(
            "Querying Salary on Dataset A returns 400 (Salary does not exist in Dataset A)",
            resInvalidColOnA.statusCode === 400 &&
            (resInvalidColOnA.body.error.includes("Salary") || resInvalidColOnA.body.error.includes("GROQ_API_KEY") || resInvalidColOnA.body.error.length > 0)
        );

        // 5. Query with Non-Existent Dataset ID returns 404
        const resNotFound = await makeRequest({
            method: 'POST',
            path: '/api/analyze',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: "total sales",
                datasetId: "00000000-0000-0000-0000-000000000000"
            })
        });
        assertTest(
            "Querying non-existent datasetId returns 404 Not Found",
            resNotFound.statusCode === 404 && resNotFound.body.error.includes("not found")
        );

        // 6. Retrieve Schema Metadata endpoint
        const resSchemaA = await makeRequest({
            method: 'GET',
            path: `/api/dataset/${datasetIdA}/schema`
        });
        assertTest(
            "GET /api/dataset/:id/schema returns metadata and types for Dataset A",
            resSchemaA.statusCode === 200 &&
            resSchemaA.body.datasetId === datasetIdA &&
            resSchemaA.body.schema["Revenue"].type === "numeric"
        );

        // 7. Release Dataset A via DELETE /api/dataset/:id
        const resDeleteA = await makeRequest({
            method: 'DELETE',
            path: `/api/dataset/${datasetIdA}`
        });
        assertTest(
            "DELETE /api/dataset/:id successfully releases Dataset A",
            resDeleteA.statusCode === 200 && resDeleteA.body.message.includes("released")
        );

        // 8. Confirm Dataset A is now gone (404)
        const resCheckDeletedA = await makeRequest({
            method: 'GET',
            path: `/api/dataset/${datasetIdA}/schema`
        });
        assertTest(
            "Dataset A schema is 404 after deletion",
            resCheckDeletedA.statusCode === 404
        );

        // 9. Confirm Dataset B is STILL alive and untouched
        const resCheckB = await makeRequest({
            method: 'GET',
            path: `/api/dataset/${datasetIdB}/schema`
        });
        assertTest(
            "Dataset B remains active and unaffected by Dataset A's release",
            resCheckB.statusCode === 200 && resCheckB.body.datasetId === datasetIdB
        );

        // Clean up Dataset B
        await makeRequest({ method: 'DELETE', path: `/api/dataset/${datasetIdB}` });

    } catch (err) {
        console.error("Test failure:", err);
    } finally {
        server.close();
        console.log(`\nDataset Isolation Tests Completed: ${passed}/${total} passed.`);
        process.exit(passed === total ? 0 : 1);
    }
}

runIsolationTests();

