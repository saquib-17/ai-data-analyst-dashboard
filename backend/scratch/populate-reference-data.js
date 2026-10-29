const { conversationRepository } = require('../repositories/conversationRepository');
const datasetId = 'f41c8197-9960-4659-a3b3-f178ca094acc';

const convs = conversationRepository.listConversations();
const hasThread = convs.some(c => c.title === 'Sales Analysis 2024');

if (!hasThread) {
  const conv = conversationRepository.createConversation({
    datasetId: datasetId,
    userId: 'local-user',
    title: 'Sales Analysis 2024'
  });

  conversationRepository.appendMessage({
    conversationId: conv.id,
    role: 'user',
    content: 'Show me the top 5 products by revenue and also show their monthly trend.',
    operation: null,
    chartConfig: null,
    suggestions: null,
    transparency: null
  });

  conversationRepository.appendMessage({
    conversationId: conv.id,
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
      data: [
        { Product: 'MacBook Pro', Revenue: 186420, Profit: 42500, Orders: 248 },
        { Product: 'iPhone 15', Revenue: 142300, Profit: 35800, Orders: 312 },
        { Product: 'Nike Shoes', Revenue: 86120, Profit: 24100, Orders: 486 },
        { Product: 'Coffee Maker', Revenue: 78450, Profit: 19200, Orders: 392 },
        { Product: 'Office Chair', Revenue: 64200, Profit: 15400, Orders: 298 }
      ]
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
      sql: 'SELECT Product, SUM(Revenue) AS Revenue FROM dataset GROUP BY Product ORDER BY Revenue DESC LIMIT 5'
    }
  });

  const otherThreads = [
    'Customer Segmentation',
    'Marketing Performance',
    'Revenue Forecast',
    'Product Analysis'
  ];
  for (const title of otherThreads) {
    conversationRepository.createConversation({
      datasetId: datasetId,
      userId: 'local-user',
      title: title
    });
  }

  console.log('Successfully created initial thread and history in SQLite');
} else {
  console.log('Initial thread already exists');
}
