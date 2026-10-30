// SAFETY GUARD: Do not execute unless explicitly requested via --force-demo-seed
if (!process.argv.includes('--force-demo-seed')) {
  console.warn('[Seed Script] Demo seed script halted. To run intentionally in dev, pass --force-demo-seed');
  process.exit(0);
}

const fs = require('fs');
const path = require('path');
const { getDb } = require('../database/db');
const { datasetRepository } = require('../repositories/datasetRepository');
const { conversationRepository } = require('../repositories/conversationRepository');

const datasetsDir = path.join(__dirname, '..', 'data', 'datasets');
if (!fs.existsSync(datasetsDir)) {
  fs.mkdirSync(datasetsDir, { recursive: true });
}

// 1. Create realistic CSV content for customer_data.csv
const customerDataId = 'c8a2e154-7f19-4a92-b883-d9229f6b4991';
const customerCsvPath = path.join(datasetsDir, `${customerDataId}.csv`);
const customerCsv = `CustomerID,CustomerName,Segment,Country,TotalSpend,PurchaseCount
CUST-1001,Alpha Enterprises,Enterprise,USA,45200,32
CUST-1002,Beta Solutions,Mid-Market,UK,28400,18
CUST-1003,Gamma Retail,SMB,Germany,14200,24
CUST-1004,Delta Tech,Enterprise,Canada,58900,45
CUST-1005,Epsilon Health,Mid-Market,Australia,31000,21
CUST-1006,Zeta Logistics,SMB,USA,19800,15
CUST-1007,Eta Finance,Enterprise,UK,67400,52
CUST-1008,Theta Edu,Mid-Market,Germany,22500,14
`;
fs.writeFileSync(customerCsvPath, customerCsv, 'utf-8');

// 2. Create realistic CSV content for marketing_campaigns.csv
const marketingDataId = 'b91d4e08-3a21-4d76-92f7-640b3c69e552';
const marketingCsvPath = path.join(datasetsDir, `${marketingDataId}.csv`);
const marketingCsv = `CampaignName,Channel,Budget,Impressions,Clicks,Conversions,ROI
Summer Launch,Google Ads,25000,450000,18000,1420,3.4
Black Friday Promo,Meta,40000,920000,35000,3100,4.2
Email Re-engagement,Klaviyo,5000,120000,8500,920,5.8
LinkedIn B2B,LinkedIn,18000,210000,7200,480,2.6
SEO Content Sprint,Organic,12000,340000,22000,1850,4.5
YouTube Tech Review,Influencer,30000,680000,28000,2100,3.8
`;
fs.writeFileSync(marketingCsvPath, marketingCsv, 'utf-8');

// Register datasets in SQLite if not already registered
const existingDatasets = datasetRepository.listDatasets();

if (!existingDatasets.some(d => d.filename === 'customer_data.csv')) {
  datasetRepository.createDataset({
    id: customerDataId,
    userId: 'local-user',
    filename: 'customer_data.csv',
    filePath: path.relative(path.join(__dirname, '..'), customerCsvPath),
    rowCount: 8321,
    columnCount: 6,
    columns: ['CustomerID', 'CustomerName', 'Segment', 'Country', 'TotalSpend', 'PurchaseCount'],
    schema: {
      CustomerID: { type: 'string' },
      CustomerName: { type: 'string' },
      Segment: { type: 'string' },
      Country: { type: 'string' },
      TotalSpend: { type: 'numeric' },
      PurchaseCount: { type: 'numeric' }
    },
    dataQuality: { completenessRate: 0.99 },
    data: [
      { CustomerID: 'CUST-1001', CustomerName: 'Alpha Enterprises', Segment: 'Enterprise', Country: 'USA', TotalSpend: 45200, PurchaseCount: 32 },
      { CustomerID: 'CUST-1002', CustomerName: 'Beta Solutions', Segment: 'Mid-Market', Country: 'UK', TotalSpend: 28400, PurchaseCount: 18 }
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  });
}

if (!existingDatasets.some(d => d.filename === 'marketing_campaigns.csv')) {
  datasetRepository.createDataset({
    id: marketingDataId,
    userId: 'local-user',
    filename: 'marketing_campaigns.csv',
    filePath: path.relative(path.join(__dirname, '..'), marketingCsvPath),
    rowCount: 5672,
    columnCount: 7,
    columns: ['CampaignName', 'Channel', 'Budget', 'Impressions', 'Clicks', 'Conversions', 'ROI'],
    schema: {
      CampaignName: { type: 'string' },
      Channel: { type: 'string' },
      Budget: { type: 'numeric' },
      Impressions: { type: 'numeric' },
      Clicks: { type: 'numeric' },
      Conversions: { type: 'numeric' },
      ROI: { type: 'numeric' }
    },
    dataQuality: { completenessRate: 0.98 },
    data: [
      { CampaignName: 'Summer Launch', Channel: 'Google Ads', Budget: 25000, Impressions: 450000, Clicks: 18000, Conversions: 1420, ROI: 3.4 },
      { CampaignName: 'Black Friday Promo', Channel: 'Meta', Budget: 40000, Impressions: 920000, Clicks: 35000, Conversions: 3100, ROI: 4.2 }
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  });
}

// 3. Clear and reseed the conversations to match the reference mockup exactly
const db = getDb();
db.prepare('DELETE FROM messages').run();
db.prepare('DELETE FROM conversations').run();

const salesDatasetId = 'f41c8197-9960-4659-a3b3-f178ca094acc';

// Thread 1: "Sales Analysis 2024" (Active conversation)
const conv1 = conversationRepository.createConversation({
  datasetId: salesDatasetId,
  userId: 'local-user',
  title: 'Sales Analysis 2024'
});

// Update timestamps so relative times look natural
const now = Date.now();
db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
  new Date(now - 2 * 60 * 1000).toISOString(),
  conv1.id
);

// Append User Question
conversationRepository.appendMessage({
  conversationId: conv1.id,
  role: 'user',
  content: 'Show me the top 5 products by revenue and also show their monthly trend.',
  operation: null,
  chartConfig: null,
  suggestions: null,
  transparency: null
});

// Trend data across 12 months for Top 5 Products
const monthlyTrendData = [
  { month: 'Jan', 'MacBook Pro': 24000, 'iPhone 15': 18000, 'Nike Shoes': 12000, 'Coffee Maker': 10000, 'Office Chair': 8500 },
  { month: 'Feb', 'MacBook Pro': 28000, 'iPhone 15': 20000, 'Nike Shoes': 13500, 'Coffee Maker': 11000, 'Office Chair': 9200 },
  { month: 'Mar', 'MacBook Pro': 31000, 'iPhone 15': 22500, 'Nike Shoes': 15000, 'Coffee Maker': 12200, 'Office Chair': 9800 },
  { month: 'Apr', 'MacBook Pro': 42000, 'iPhone 15': 29000, 'Nike Shoes': 19500, 'Coffee Maker': 15000, 'Office Chair': 11500 },
  { month: 'May', 'MacBook Pro': 51000, 'iPhone 15': 36000, 'Nike Shoes': 23000, 'Coffee Maker': 17500, 'Office Chair': 13000 },
  { month: 'Jun', 'MacBook Pro': 48000, 'iPhone 15': 34000, 'Nike Shoes': 22000, 'Coffee Maker': 16800, 'Office Chair': 12600 },
  { month: 'Jul', 'MacBook Pro': 58000, 'iPhone 15': 41000, 'Nike Shoes': 26500, 'Coffee Maker': 19500, 'Office Chair': 14800 },
  { month: 'Aug', 'MacBook Pro': 53000, 'iPhone 15': 38000, 'Nike Shoes': 24500, 'Coffee Maker': 18200, 'Office Chair': 13900 },
  { month: 'Sep', 'MacBook Pro': 46000, 'iPhone 15': 33000, 'Nike Shoes': 21000, 'Coffee Maker': 16000, 'Office Chair': 12200 },
  { month: 'Oct', 'MacBook Pro': 39000, 'iPhone 15': 28000, 'Nike Shoes': 18000, 'Coffee Maker': 14200, 'Office Chair': 11000 },
  { month: 'Nov', 'MacBook Pro': 34000, 'iPhone 15': 24000, 'Nike Shoes': 15500, 'Coffee Maker': 12500, 'Office Chair': 9800 },
  { month: 'Dec', 'MacBook Pro': 45000, 'iPhone 15': 32000, 'Nike Shoes': 20500, 'Coffee Maker': 16000, 'Office Chair': 12000 }
];

// Append Assistant Turn with Dual Chart Configuration
conversationRepository.appendMessage({
  conversationId: conv1.id,
  role: 'assistant',
  content: 'Here are the top 5 products by revenue along with their monthly trend. The analysis shows that **MacBook Pro** is the highest performing product with **₹186K** in revenue, followed by **iPhone 15** and **Nike Shoes**. All top products show a positive growth trend with peak sales in Q2 2024.',
  operation: {
    operation: 'group_by',
    column: 'Product',
    metric: 'Revenue',
    limit: 5,
    chartType: 'bar'
  },
  chartConfig: {
    type: 'horizontal-bar',
    xKey: 'Product',
    yKey: 'Revenue',
    title: 'Top 5 Products by Revenue',
    subtitle: 'Total revenue for each product',
    data: [
      { Product: 'MacBook Pro', Revenue: 186420, Orders: 248, Profit: 42500, AOV: 752, Growth: '24.5' },
      { Product: 'iPhone 15', Revenue: 142300, Orders: 312, Profit: 35800, AOV: 456, Growth: '18.2' },
      { Product: 'Nike Shoes', Revenue: 86120, Orders: 486, Profit: 24100, AOV: 177, Growth: '12.8' },
      { Product: 'Coffee Maker', Revenue: 78450, Orders: 392, Profit: 19200, AOV: 200, Growth: '15.6' },
      { Product: 'Office Chair', Revenue: 64200, Orders: 298, Profit: 15400, AOV: 215, Growth: '11.3' }
    ],
    trendConfig: {
      type: 'multi-line',
      xKey: 'month',
      title: 'Monthly Sales Trend (Top 5 Products)',
      subtitle: 'Revenue trend from Jan - Dec 2024',
      lines: ['MacBook Pro', 'iPhone 15', 'Nike Shoes', 'Coffee Maker', 'Office Chair'],
      data: monthlyTrendData
    }
  },
  suggestions: [
    'Show profit margins for these products',
    'Compare with previous year',
    'Break down by region',
    'Show as a pie chart'
  ],
  transparency: {
    operation: 'group_by',
    column: 'Product',
    metric: 'Revenue',
    filters: [],
    limit: 5,
    engine: 'duckdb',
    rowCount: 5,
    sql: 'SELECT Product, SUM(Revenue) AS Revenue, COUNT(*) AS Orders, AVG(Revenue) AS AOV FROM dataset GROUP BY Product ORDER BY Revenue DESC LIMIT 5'
  }
});

// Thread 2: "Customer Segmentation" (1 hour ago)
const conv2 = conversationRepository.createConversation({
  datasetId: customerDataId,
  userId: 'local-user',
  title: 'Customer Segmentation'
});
db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
  new Date(now - 60 * 60 * 1000).toISOString(),
  conv2.id
);

// Thread 3: "Marketing Performance" (3 hours ago)
const conv3 = conversationRepository.createConversation({
  datasetId: marketingDataId,
  userId: 'local-user',
  title: 'Marketing Performance'
});
db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
  new Date(now - 3 * 60 * 60 * 1000).toISOString(),
  conv3.id
);

// Thread 4: "Revenue Forecast" (1 day ago)
const conv4 = conversationRepository.createConversation({
  datasetId: salesDatasetId,
  userId: 'local-user',
  title: 'Revenue Forecast'
});
db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
  new Date(now - 24 * 60 * 60 * 1000).toISOString(),
  conv4.id
);

// Thread 5: "Product Analysis" (2 days ago)
const conv5 = conversationRepository.createConversation({
  datasetId: salesDatasetId,
  userId: 'local-user',
  title: 'Product Analysis'
});
db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
  new Date(now - 48 * 60 * 60 * 1000).toISOString(),
  conv5.id
);

console.log('Successfully seeded reference datasets and conversations.');

