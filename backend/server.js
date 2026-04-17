require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { convertQueryToJson, generateInsight } = require('./services/queryParser');
const { processData } = require('./services/dataProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Global storage for the CURRENTLY uploaded dataset (In-memory)
let currentDataset = [];

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running' });
});

/**
 * AI Query to JSON Parser endpoint
 */
app.post('/api/query-to-json', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing 'query' field." });
    }
    
    const parsedData = await convertQueryToJson(query);
    res.json(parsedData);
  } catch (err) {
    console.error("Query parse failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Comprehensive Analytics Endpoint
 * 1. AI Parsing
 * 2. Data Processing
 * 3. Insight Generation
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing 'query' field." });
    }

    if (!currentDataset || currentDataset.length === 0) {
      return res.status(400).json({ error: "No dataset available. Please upload a CSV first." });
    }

    // Phase 1: AI Parsing
    const structuredQuery = await convertQueryToJson(query);
    console.log("Structured Query:", JSON.stringify(structuredQuery, null, 2));

    // Phase 2: Data Processing
    const results = processData(currentDataset, structuredQuery);

    // Phase 3: AI Insight Generation
    const insight = await generateInsight(query, results);

    res.json({
      result: results,
      insight: insight
    });

  } catch (err) {
    console.error("Analysis failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer config
const upload = multer({ dest: 'uploads/', limits: { fileSize: 2 * 1024 * 1024 } });

/**
 * CSV Upload and Processing
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (req.file.mimetype !== 'text/csv' && !req.file.originalname.endsWith('.csv')) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Please upload a valid .csv file.' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(req.file.path);
      
      // Update global storage
      currentDataset = results;
      
      res.json({ 
        message: 'File successfully processed and stored.', 
        data: results 
      });
    })
    .on('error', (error) => {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Error parsing CSV:', error);
      res.status(500).json({ error: 'Failed to process CSV file.' });
    });
});

app.get("/", (req, res) => {
  res.send("🚀 AI Data Analyst Backend is Running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

