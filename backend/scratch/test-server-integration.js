const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const { clearAllDatasets } = require('../services/datasetRegistry');

const TEST_PORT = 5099;
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

async function runIntegrationTests() {
    console.log("Starting Server Integration Tests...\n");
    server = app.listen(TEST_PORT);
    await clearAllDatasets();

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
        // Test 1: Security Headers
        const resTest = await makeRequest({ method: 'GET', path: '/api/test' });
        assertTest(
            "Security Headers applied",
            resTest.headers['x-content-type-options'] === 'nosniff' &&
            resTest.headers['x-frame-options'] === 'DENY' &&
            !resTest.headers['x-powered-by']
        );

        // Test 2: Analyze without dataset uploaded returns 400
        const resNoData = await makeRequest({
            method: 'POST',
            path: '/api/analyze',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "show top sales" })
        });
        assertTest(
            "Analyze without dataset returns 400",
            resNoData.statusCode === 400 && resNoData.body.error.includes("No dataset available")
        );

        // Test 3: Empty query rejected
        const resEmptyQuery = await makeRequest({
            method: 'POST',
            path: '/api/analyze',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "   " })
        });
        assertTest(
            "Empty query rejected with 400",
            resEmptyQuery.statusCode === 400
        );

        // Test 4: Upload empty (0-byte) CSV file
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const emptyMultipart = createMultipartFormData(boundary, 'empty.csv', 'text/csv', '');
        const resEmptyFile = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': emptyMultipart.length
            },
            body: emptyMultipart
        });
        assertTest(
            "Empty CSV rejected with 400",
            resEmptyFile.statusCode === 400 && resEmptyFile.body.error.includes("empty")
        );

        // Test 5: Upload invalid non-CSV file type
        const txtMultipart = createMultipartFormData(boundary, 'script.exe', 'application/x-msdownload', 'malicious code');
        const resBadFile = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': txtMultipart.length
            },
            body: txtMultipart
        });
        assertTest(
            "Non-CSV file rejected with 400",
            resBadFile.statusCode === 400 && resBadFile.body.error.includes(".csv")
        );

        // Test 6: Upload valid CSV with messy/currency numbers
        const validCsv = `Product,Revenue,Region,Year
Laptop,"$1,200.50",North,2023
Phone,"800",South,2023
Tablet,"N/A",North,2022
Monitor,"$300.00",East,2023
Mouse,"-$50.00",West,2023
`;
        const validMultipart = createMultipartFormData(boundary, 'sales_data.csv', 'text/csv', validCsv);
        const resUpload = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': validMultipart.length
            },
            body: validMultipart
        });
        assertTest(
            "Valid CSV uploaded and processed successfully",
            resUpload.statusCode === 200 && resUpload.body.rowCount === 5 && resUpload.body.columns.includes("Revenue"),
            JSON.stringify(resUpload.body)
        );

        // Test 7: Query after dataset upload (e.g. sum of revenue)
        // If GROQ_API_KEY is not configured in local test env, convertQueryToJson will return explicit error or handle gracefully
        const resAnalyze = await makeRequest({
            method: 'POST',
            path: '/api/analyze',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "What is the total revenue?" })
        });
        assertTest(
            "Analyze endpoint responds with structured status (either 200 if Groq available or 400 explicit config message)",
            resAnalyze.statusCode === 200 || (resAnalyze.statusCode === 400 && resAnalyze.body.error.length > 0),
            `Status: ${resAnalyze.statusCode}, Body: ${JSON.stringify(resAnalyze.body)}`
        );

        // Test 8: Upload oversized file (> 2MB)
        // Create 2.2MB buffer
        const largeContent = 'a,b,c\n' + '1,2,3\n'.repeat(400000); // approx 2.4 MB
        const largeMultipart = createMultipartFormData(boundary, 'large.csv', 'text/csv', largeContent);
        const resLarge = await makeRequest({
            method: 'POST',
            path: '/api/upload',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': largeMultipart.length
            },
            body: largeMultipart
        });
        assertTest(
            "Oversized file (>2MB) returns 413 Payload Too Large",
            resLarge.statusCode === 413 && resLarge.body.error.includes("2MB"),
            `Status: ${resLarge.statusCode}, Body: ${JSON.stringify(resLarge.body)}`
        );

    } catch (err) {
        console.error("Integration Test Failure:", err);
    } finally {
        server.close();
        console.log(`\nIntegration Tests Completed: ${passed}/${total} passed.`);
        process.exit(passed === total ? 0 : 1);
    }
}

runIntegrationTests();

