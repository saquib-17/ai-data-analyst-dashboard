const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'local-user'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING NEW CONVERSATION & DATASET ISOLATION VERIFICATION ===\n');

  // 1. Fetch available datasets
  const dsRes = await request('GET', '/api/datasets');
  assert.strictEqual(dsRes.status, 200, 'Datasets endpoint should return 200');
  const datasets = dsRes.data.datasets || [];
  assert.ok(datasets.length >= 2, 'Should have at least 2 datasets registered');
  
  const salesDs = datasets.find(d => d.filename.includes('sales_data_2024')) || datasets[0];
  const customerDs = datasets.find(d => d.filename.includes('customer_data')) || datasets[1];
  console.log(`✓ Datasets confirmed: Sales (${salesDs.id}), Customer (${customerDs.id})`);

  // Scenario A: Create New Conversation with datasetId: null
  console.log('\n--- Scenario A: New Conversation without inherited dataset ---');
  const newConvRes = await request('POST', '/api/conversations', {
    title: 'Brand New Analysis',
    datasetId: null
  });
  assert.strictEqual(newConvRes.status, 201, 'POST /api/conversations should return 201');
  const freshConv = newConvRes.data;
  assert.strictEqual(freshConv.datasetId, null, 'Fresh conversation MUST have datasetId: null');
  assert.strictEqual(freshConv.messages.length, 0, 'Fresh conversation MUST have 0 messages');
  console.log(`✓ Fresh conversation created with ID ${freshConv.id} and datasetId: null`);

  // Verify fetch of this conversation
  const fetchFresh = await request('GET', `/api/conversations/${freshConv.id}`);
  assert.strictEqual(fetchFresh.status, 200);
  assert.strictEqual(fetchFresh.data.datasetId, null, 'Fetched conversation must maintain datasetId: null');
  assert.strictEqual(fetchFresh.data.messages.length, 0, 'Fetched conversation must maintain 0 messages');
  console.log('✓ Verified GET /api/conversations/:id reflects datasetId: null');

  // Scenario B: Explicitly attach dataset and execute query
  console.log('\n--- Scenario B: Attach dataset to fresh conversation & analyze ---');
  const patchRes = await request('PATCH', `/api/conversations/${freshConv.id}`, {
    datasetId: customerDs.id
  });
  assert.strictEqual(patchRes.status, 200, 'PATCH /api/conversations/:id should return 200');
  assert.strictEqual(patchRes.data.datasetId, customerDs.id, 'Conversation datasetId must now match customerDs');
  console.log(`✓ Attached customer dataset (${customerDs.id}) to conversation`);

  // Run query in this conversation
  const analyzeRes = await request('POST', '/api/analyze', {
    query: 'What is the total TotalSpend?',
    datasetId: customerDs.id,
    conversationId: freshConv.id
  });
  assert.strictEqual(analyzeRes.status, 200, 'POST /api/analyze should return 200');
  assert.strictEqual(analyzeRes.data.conversationId, freshConv.id);
  console.log('✓ Executed analytical query in newly attached conversation');

  // Verify messages are saved ONLY under this conversation
  const verifyConv = await request('GET', `/api/conversations/${freshConv.id}`);
  assert.strictEqual(verifyConv.data.messages.length, 2, 'Should have user and assistant messages');
  assert.strictEqual(verifyConv.data.datasetId, customerDs.id);
  console.log('✓ Verified 2 messages saved under the new conversation');

  // Scenario C: Switch between conversations & verify dataset isolation
  console.log('\n--- Scenario C: Verify conversation-to-dataset isolation ---');
  const allConvsRes = await request('GET', '/api/conversations');
  const convs = allConvsRes.data.conversations || [];

  const salesConv = convs.find(c => c.title.includes('Sales Analysis 2024'));
  const custConv = convs.find(c => c.title.includes('Customer Segmentation'));

  if (salesConv) {
    const sDetail = await request('GET', `/api/conversations/${salesConv.id}`);
    assert.strictEqual(sDetail.data.datasetId, salesDs.id, 'Sales conversation must be linked to sales dataset');
    console.log(`✓ Sales Analysis 2024 is strictly linked to ${salesDs.filename}`);
  }

  if (custConv) {
    const cDetail = await request('GET', `/api/conversations/${custConv.id}`);
    assert.strictEqual(cDetail.data.datasetId, customerDs.id, 'Customer conversation must be linked to customer dataset');
    console.log(`✓ Customer Segmentation is strictly linked to ${customerDs.filename}`);
  }

  // Cleanup the test conversation
  await request('DELETE', `/api/conversations/${freshConv.id}`);
  console.log(`✓ Cleaned up test conversation ${freshConv.id}`);

  console.log('\n========================================');
  console.log('ALL NEW CONVERSATION & ISOLATION TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});

