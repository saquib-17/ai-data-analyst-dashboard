require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { convertQueryToJson, generateInsight } = require('./services/queryParser');
const { registerDataset, getDataset, listDatasets, releaseDataset } = require('./services/datasetRegistry');
const { executeAnalyticalQuery } = require('./services/analyticalEngine');
const { recommendChart } = require('./services/chartRecommender');
const { generateSuggestions } = require('./services/suggestionGenerator');
const { runMigrations } = require('./database/migrator');
const { conversationRepository } = require('./repositories/conversationRepository');

// Initialize database schema migrations
try {
  runMigrations();
} catch (migErr) {
  console.warn('[Database Migration Warning]', migErr.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// Configurable CORS Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://ai-data-analyst-dashboard-phi.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) or allowed domains or non-production local dev
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS request blocked by security policy.'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// In-Memory Sliding Window Rate Limiter
function createRateLimiter(windowMs, maxRequests, endpointName) {
  const requests = new Map();

  // Periodically clean stale records every 5 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const recent = timestamps.filter(t => now - t < windowMs);
      if (recent.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, recent);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return res.status(429).json({
        error: `Too many ${endpointName} requests. Please slow down and try again shortly.`
      });
    }

    recent.push(now);
    requests.set(ip, recent);
    next();
  };
}

const uploadLimiter = createRateLimiter(15 * 60 * 1000, 30, 'upload');
const analyzeLimiter = createRateLimiter(60 * 1000, 60, 'analysis');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config: strict 2MB limit
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Safe file cleanup helper
function cleanupFile(filePath, retryCount = 1) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      if (err.code === 'EBUSY' && retryCount > 0) {
        setTimeout(() => cleanupFile(filePath, retryCount - 1), 100).unref();
      } else {
        console.warn(`[Cleanup Warning] Could not delete temp file ${filePath}:`, err.message);
      }
    }
  }
}

// Middleware wrapper for Multer error handling
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds the 2MB limit. Please upload a smaller CSV file.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    next();
  });
};

// Health Check
app.get('/api/test', (req, res) => {
  const datasets = listDatasets();
  res.json({
    status: 'ok',
    message: 'Backend is running',
    activeDatasetCount: datasets.length,
    datasets: datasets
  });
});

/**
 * List all active datasets
 */
app.get('/api/datasets', (req, res) => {
  res.json({
    datasets: listDatasets()
  });
});

/**
 * Get schema profile for a specific dataset
 */
app.get('/api/dataset/:id/schema', (req, res) => {
  const dataset = getDataset(req.params.id);
  if (!dataset) {
    return res.status(404).json({
      error: `Dataset with ID '${req.params.id}' was not found. It may have expired or been released.`
    });
  }

  res.json({
    datasetId: dataset.id,
    filename: dataset.filename,
    uploadedAt: dataset.uploadedAt,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
    columns: dataset.columns,
    schema: dataset.schema,
    dataQuality: dataset.dataQuality
  });
});

/**
 * Release / disconnect a specific dataset
 */
app.delete('/api/dataset/:id', async (req, res) => {
  const success = await releaseDataset(req.params.id);
  if (!success) {
    return res.status(404).json({
      error: `Dataset with ID '${req.params.id}' was not found or has already been released.`
    });
  }

  res.json({
    message: "Dataset successfully released from memory.",
    datasetId: req.params.id
  });
});

/**
 * ==========================================
 * CONVERSATION PERSISTENCE API ENDPOINTS
 * ==========================================
 */

/**
 * List saved conversations (optionally filtered by datasetId)
 */
app.get('/api/conversations', (req, res) => {
  const { datasetId } = req.query;
  const userId = req.headers['x-user-id'] || 'local-user';
  const conversations = conversationRepository.listConversations(userId, datasetId || null);
  res.json({ conversations });
});

/**
 * Create a new conversation thread
 */
app.post('/api/conversations', (req, res) => {
  const { title, datasetId } = req.body || {};
  const userId = req.headers['x-user-id'] || 'local-user';
  const conversation = conversationRepository.createConversation({
    title,
    datasetId: datasetId || null,
    userId
  });
  res.status(201).json(conversation);
});

/**
 * Get a specific conversation with ordered message history
 */
app.get('/api/conversations/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'local-user';
  const conversation = conversationRepository.getConversationById(req.params.id, userId);
  if (!conversation) {
    return res.status(404).json({
      error: `Conversation with ID '${req.params.id}' was not found.`
    });
  }
  res.json(conversation);
});

/**
 * Update conversation title or linked dataset
 */
app.patch('/api/conversations/:id', (req, res) => {
  const { title, datasetId } = req.body || {};
  const userId = req.headers['x-user-id'] || 'local-user';
  let conversation = null;

  if (title !== undefined) {
    conversation = conversationRepository.updateConversationTitle(req.params.id, title, userId);
  }
  if (datasetId !== undefined) {
    conversation = conversationRepository.updateConversationDataset(req.params.id, datasetId, userId);
  }

  if (!conversation) {
    return res.status(404).json({
      error: `Conversation with ID '${req.params.id}' was not found.`
    });
  }

  res.json(conversation);
});

/**
 * Delete a conversation and its messages
 */
app.delete('/api/conversations/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'local-user';
  const deleted = conversationRepository.deleteConversation(req.params.id, userId);
  if (!deleted) {
    return res.status(404).json({
      error: `Conversation with ID '${req.params.id}' was not found.`
    });
  }
  res.json({
    success: true,
    message: "Conversation deleted successfully.",
    conversationId: req.params.id
  });
});

/**
 * AI Query to JSON Parser endpoint (Internal / Testing)
 */
app.post('/api/query-to-json', analyzeLimiter, async (req, res, next) => {
  try {
    const { query, datasetId } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'query' field." });
    }

    const dataset = getDataset(datasetId);
    const datasetInfo = dataset ? { columns: dataset.columns, schema: dataset.schema } : {};

    const parsedData = await convertQueryToJson(query.trim(), datasetInfo);

    if (parsedData.error) {
      return res.status(400).json({ error: parsedData.error });
    }

    res.json(parsedData);
  } catch (err) {
    next(err);
  }
});

/**
 * Comprehensive Analytics Endpoint
 * 1. Resolves dataset by datasetId
 * 2. Grounded AI parsing using dataset schema
 * 3. Analytical query execution via DuckDB (with deterministic JS fallback)
 * 4. Grounded insight generation strictly based on verified computed numbers
 */
app.post('/api/analyze', analyzeLimiter, async (req, res, next) => {
  try {
    const { query, datasetId, conversationContext, conversationId } = req.body;
    const userId = req.headers['x-user-id'] || 'local-user';

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'query' field. Please ask a specific question about your data." });
    }

    if (query.trim().length > 500) {
      return res.status(400).json({ error: "Query exceeds the maximum allowed length of 500 characters." });
    }

    const dataset = getDataset(datasetId);
    if (!dataset) {
      if (datasetId) {
        return res.status(404).json({
          error: `Dataset with ID '${datasetId}' was not found. Please upload a dataset first.`
        });
      }
      return res.status(400).json({
        error: "No dataset available. Please upload a CSV first."
      });
    }

    // Conversation persistence binding - ensure conversation always exists and is tracked
    let activeConv = null;
    if (conversationId && typeof conversationId === 'string' && conversationId.trim()) {
      activeConv = conversationRepository.getConversationById(conversationId.trim(), userId);
      if (!activeConv) {
        activeConv = conversationRepository.createConversation({
          id: conversationId.trim(),
          datasetId: dataset.id,
          userId,
          title: query.trim().slice(0, 45)
        });
      } else {
        if (!activeConv.datasetId && dataset.id) {
          conversationRepository.updateConversationDataset(activeConv.id, dataset.id, userId);
        }
        if (activeConv.title === 'New Conversation' || activeConv.title === 'New Analysis') {
          conversationRepository.updateConversationTitle(activeConv.id, query.trim().slice(0, 45), userId);
        }
      }
    } else {
      activeConv = conversationRepository.createConversation({
        datasetId: dataset.id,
        userId,
        title: query.trim().slice(0, 45)
      });
    }

    // Record user turn in conversation history
    if (activeConv) {
      conversationRepository.appendMessage({
        conversationId: activeConv.id,
        role: 'user',
        content: query.trim()
      });
    }

    // Phase 1: AI Parsing grounded in dataset schema and previous conversation context
    const structuredQuery = await convertQueryToJson(
      query.trim(), 
      {
        columns: dataset.columns,
        schema: dataset.schema
      },
      conversationContext || {}
    );

    if (structuredQuery.error) {
      return res.status(400).json({ error: structuredQuery.error });
    }

    // Phase 2: Deterministic Analytical Query Execution
    const execution = await executeAnalyticalQuery(dataset, structuredQuery);

    // Phase 3: AI Insight Generation strictly grounded in computed data
    const insight = await generateInsight(query.trim(), execution.result, {
      operation: structuredQuery.operation,
      column: structuredQuery.column,
      metric: structuredQuery.metric,
      datasetName: dataset.filename
    });

    // Phase 4: Deterministic Chart Recommendation
    const chartConfig = recommendChart({
      operation: structuredQuery.operation,
      column: structuredQuery.column,
      metric: structuredQuery.metric,
      results: execution.result,
      schema: dataset.schema
    });

    // Phase 5: Grounded Follow-up Suggestions
    const suggestedQuestions = generateSuggestions({
      schema: dataset.schema,
      columns: dataset.columns,
      currentQuery: query.trim(),
      lastOperation: structuredQuery
    });

    const transparencyData = {
      operation: structuredQuery.operation,
      metric: structuredQuery.metric || null,
      column: structuredQuery.column || null,
      filters: structuredQuery.filters || [],
      limit: structuredQuery.limit || null,
      engine: execution.metadata?.engine || "duckdb",
      rowCount: execution.result ? execution.result.length : 0,
      sql: execution.metadata?.sql || null
    };

    // If conversation is active, persist assistant turn
    if (activeConv) {
      conversationRepository.appendMessage({
        conversationId: activeConv.id,
        role: 'assistant',
        content: insight,
        operation: structuredQuery,
        chartConfig: chartConfig,
        transparency: transparencyData,
        suggestions: suggestedQuestions
      });
    }

    res.json({
      result: execution.result,
      insight: insight,
      datasetId: dataset.id,
      conversationId: activeConv ? activeConv.id : null,
      queryInterpretation: structuredQuery,
      chartConfig: chartConfig,
      suggestedQuestions: suggestedQuestions,
      transparency: transparencyData,
      metadata: execution.metadata
    });

  } catch (err) {
    next(err);
  }
});

/**
 * CSV Upload and Processing
 * Handles file size limits, MIME type validation, empty files, streaming parse errors,
 * schema profiling, and dataset registry isolation.
 */
app.post('/api/upload', uploadLimiter, handleUploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Check 0-byte files
  if (req.file.size === 0) {
    cleanupFile(req.file.path);
    return res.status(400).json({ error: 'The uploaded file is empty (0 bytes).' });
  }

  const originalName = req.file.originalname.toLowerCase();
  const validMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain',
    'application/csv',
    'text/x-csv',
    'application/octet-stream'
  ];

  if (!originalName.endsWith('.csv') || !validMimes.includes(req.file.mimetype)) {
    cleanupFile(req.file.path);
    return res.status(400).json({ error: 'Please upload a valid .csv file.' });
  }

  const results = [];
  let parseErrorOccurred = false;

  const stream = fs.createReadStream(req.file.path);
  stream
    .pipe(csv())
    .on('data', (data) => {
      // Exclude completely blank rows
      const hasContent = Object.values(data).some(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (hasContent) {
        results.push(data);
      }
    })
    .on('error', (error) => {
      parseErrorOccurred = true;
      stream.destroy();
      cleanupFile(req.file.path);
      console.error('Error parsing CSV:', error.message);
      if (!res.headersSent) {
        return res.status(400).json({ error: 'Failed to parse CSV file. Please verify delimiter format and CSV structure.' });
      }
    })
    .on('end', async () => {
      const uploadedFilePath = req.file.path;
      stream.destroy();
      if (parseErrorOccurred) return;

      if (results.length === 0) {
        cleanupFile(uploadedFilePath);
        return res.status(400).json({ error: 'The uploaded CSV file contains no data rows.' });
      }

      const columns = Object.keys(results[0]);
      if (columns.length === 0) {
        cleanupFile(uploadedFilePath);
        return res.status(400).json({ error: 'No header columns could be identified in the CSV file.' });
      }

      try {
        const userId = req.headers['x-user-id'] || 'local-user';

        // Register in dataset registry with schema profiling, persistent storage, and DuckDB provisioning
        const dataset = await registerDataset({
          filename: req.file.originalname,
          rows: results,
          rawHeaders: columns,
          filePath: uploadedFilePath,
          userId
        });

        // Clean up uploaded temporary file now that DuckDB has loaded it
        cleanupFile(uploadedFilePath);

        res.json({
          message: 'File successfully processed and stored.',
          datasetId: dataset.id,
          filename: dataset.filename,
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
          columns: dataset.columns,
          schema: dataset.schema,
          dataQuality: dataset.dataQuality,
          data: dataset.data // first 100 rows preview
        });

      } catch (regErr) {
        cleanupFile(uploadedFilePath);
        console.error("Dataset registration error:", regErr);
        res.status(500).json({ error: `Failed to register dataset: ${regErr.message}` });
      }
    });
});

app.get("/", (req, res) => {
  res.send("🚀 AI Data Analyst Backend is Running!");
});

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server if invoked directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
