# DataMind AI — Your Personal Data Analyst

<div align="center">

![DataMind AI](https://img.shields.io/badge/DataMind%20AI-v2.0-6366F1?style=for-the-badge)
![DuckDB](https://img.shields.io/badge/DuckDB-1.4.4-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Cinematic%20Dark-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3-F55036?style=for-the-badge)

**A next-generation, cinematic dark Conversational AI Data Analyst and Business Intelligence SaaS platform that turns raw CSV data into verified analytical insights, interactive visualizations, and automated executive reports.**

[Live Demo](https://ai-data-analyst-dashboard-phi.vercel.app/) • [Architecture](#-architecture--technology-stack) • [Key Features](#-key-features) • [Getting Started](#-getting-started) • [API Reference](#-api-reference)

</div>

---

## 🌟 Executive Overview

**DataMind AI** bridges natural language and high-performance columnar data processing. Traditional BI tools require SQL fluency, complex dashboards, and manual formula authoring. Simple LLM wrappers, conversely, frequently hallucinate arithmetic sums, averages, and rankings. 

DataMind AI solves this with a **deterministic hybrid architecture**:
1. **Groq (Llama 3.3)** interprets natural-language user intent and compiles questions into deterministic query operations.
2. **DuckDB** executes the verified arithmetic, aggregations, and grouping directly in-memory against raw dataset rows — **guaranteeing 100% calculation accuracy with zero numerical hallucinations**.
3. **SQLite (`better-sqlite3` with WAL mode)** persists dataset metadata, column schemas, conversation threads, and full analytical message history across server restarts.
4. **Cinematic Dark UI** provides an executive-grade experience with dual application states, glowing SVG illustrations, dynamic KPI sparklines, and Recharts visual analytics.

---

## 🚀 Dual-State Dashboard Experience

The platform dynamically transitions between two dedicated application states depending on dataset attachment:

```
                      ┌────────────────────────────────────────┐
                      │    DataMind AI Application Shell      │
                      │  (Dark Sidebar + TopNav + Workspace)   │
                      └──────────────────┬─────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
   ┌───────────────────────────────┐           ┌───────────────────────────────┐
   │   STATE A: Welcome Dashboard  │           │ STATE B: Analytics Dashboard  │
   │    (First-time User Journey)  │           │  (Active Connected Workspace) │
   ├───────────────────────────────┤           ├───────────────────────────────┤
   │ • Condition: No active dataset│           │ • Condition: Dataset attached │
   │ • Hero: "Your data has a story│           │ • Compact AI banner + Robot   │
   │   Let's find it together."    │           │ • 4 KPI cards + SVG sparklines│
   │ • Cute glowing AI robot avatar│           │ • Multi-line Revenue Trend    │
   │ • "Upload" & "Explore Sample" │           │ • Top Products Bar Chart      │
   │ • 4 Quick-Action cards        │           │ • Regional Sales Donut Chart  │
   │ • 5 Example question pills    │           │ • Right Context & Preview panel│
   └───────────────────────────────┘           └───────────────────────────────┘
```

### State A: First-Time Welcome Dashboard
Designed for immediate onboarding when no dataset is connected to the workspace:
- **Hero Card**: Deep obsidian canvas with violet/cyan ambient glows, large headline (*"Your data has a story. Let's find it together."*), and dual call-to-actions (*"Upload Your First Dataset"* & *"Explore Sample Dataset"*).
- **Trust Badges**: Three verified value checkmarks (*"No coding required"*, *"Instant visualizations"*, *"Secure & private"*).
- **Custom AI Robot Companion**: Pure SVG glowing robot illustration with visor reflections, friendly cyan eyes, headset microphone, and floating holographic charts.
- **4 Quick-Action Cards**: Responsive interactive cards for *Upload Dataset*, *Ask Questions*, *Get Visualizations*, and *Discover Insights*.
- **Interactive Question Starters**: 5 clickable example queries that automatically mount the sample sales dataset and run instantaneous queries.

### State B: Connected Analytics Dashboard
Rendered when a dataset (e.g. `sales_data_2024.csv`) is attached:
- **Compact AI Banner**: Streamlined robot avatar with quick question pills and library browsing.
- **4 Real-Time KPI Cards**: Total Revenue, Total Orders, Unique Customers, and Avg. Order Value with percentage change badges and dynamic SVG sparklines computed from DuckDB.
- **Revenue & Orders Trend**: Multi-line visualization tracking revenue and volume over time, featuring time-range filtering (`7D`, `30D`, `90D`, `1Y`), chart type switching, and custom dark tooltip cards.
- **Top Products by Revenue**: Horizontal rounded gradient bar chart ranking top performers.
- **Sales by Region**: Donut chart with regional percentage breakdown and center revenue callout.
- **Recent Insights Bulletin**: Auto-generated statistical observations and key business opportunities.
- **Right Context Panel**: Active file metadata, column schema previews with data type icons (`Aa` string, `#` numeric, `📅` date), and quick-action shortcuts.

### AI Copilot Conversational Workspace
- Multi-turn conversational analysis with context awareness and memory of previous operations.
- Dynamic visual chart generation (Bar, Line, Area, Horizontal Bar, Donut/Pie, and Table View).
- Structured tabular breakdowns with rankings and growth indicators.
- One-click follow-up query suggestions based on analytical results.
- **SQL Transparency Toggle**: Inspect the exact DuckDB SQL statement executed under the hood.

---

## 🛠️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (React 18 + Vite)                │
│                                                                        │
│   DashboardOverview     ConversationView      DatasetsView   SchemaView│
│   (State A & State B)   (AI Copilot Thread)   (Dropzone)     (Profiling│
│                                                                        │
│       TopNav (Global Search Ctrl+K) • Sidebar (⌘N New Thread)          │
│             Tailwind CSS Cinematic Dark Theme (#06080F)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (Node.js + Express)              │
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────┐   ┌─────────────────┐ │
│   │    Groq AI LLM     │   │   DuckDB Engine   │   │  SQLite (WAL)   │ │
│   │  (Llama 3.3 Model) │   │ (Columnar In-Mem) │   │ (Persistent DB) │ │
│   │                    │   │                   │   │                 │ │
│   │ Translates natural │   │ 100% deterministic│   │ ACID storage for│ │
│   │ language questions │   │ sums, averages,   │   │ datasets, paths,│ │
│   │ into query specs   │   │ top-N & filters   │   │ threads & msgs  │ │
│   └────────────────────┘   └───────────────────┘   └─────────────────┘ │
│                                                                        │
│   Durable CSV Storage: backend/data/datasets/<uuid>.csv                │
└────────────────────────────────────────────────────────────────────────┘
```

### Frontend
- **React 18**: Component-driven SPA architecture.
- **Vite 5**: Sub-second HMR and optimized production bundling.
- **Tailwind CSS 3**: Custom cinematic dark design tokens (`#06080F` canvas, `#0E1628` cards, `#111C30` elevated surfaces, `#0B1220` inputs).
- **Recharts 3**: Responsive, composable SVG charts with dark axes and tooltips.
- **Lucide React**: Crisp iconography for actions, files, and column types.

### Backend
- **Node.js & Express**: High-throughput REST API with centralized error handling.
- **DuckDB 1.4**: Zero-latency in-memory analytical SQL engine with dataset-scoped isolation.
- **better-sqlite3**: Synchronous, high-performance SQLite persistence with Write-Ahead Logging (`WAL`).
- **Groq Cloud SDK**: Ultrafast inference via `llama-3.3-70b-versatile`.
- **Multer & csv-parser**: Streaming file ingestion with type inference, currency stripping, and schema profiling.

---

## 🔒 Data Isolation & Persistence Guarantees

1. **Zero Cross-Dataset Leakage**:
   - Every uploaded CSV is assigned an immutable UUID.
   - In DuckDB, table names are scoped strictly to `dataset_<uuid>`. Queries for dataset A can never touch or query dataset B.
2. **Durability Across Server Restarts**:
   - Raw CSVs are safely persisted in `backend/data/datasets/`.
   - Metadata, schemas, profiling metrics, conversation threads, and message history reside in SQLite (`backend/database/analyst.db`).
   - If the backend process restarts, DuckDB reloads tables on-demand from durable storage with zero data loss.
3. **Clean New Conversation Lifecycle**:
   - Clicking **New Conversation** or pressing `⌘ N` creates an unattached thread with `datasetId: null`.
   - The workspace resets completely to State A, showing zero residual metadata or suggested questions from previous datasets.

---

## 📂 Project Structure

```text
ai-data-analyst-dashboard/
├── backend/
│   ├── data/
│   │   └── datasets/                 # Durable persistent CSV storage (<uuid>.csv)
│   ├── database/
│   │   ├── migrations/               # SQLite schema version migrations
│   │   ├── analyst.db                # SQLite database file (WAL mode)
│   │   └── db.js                     # SQLite connection manager & WAL enabler
│   ├── repositories/
│   │   ├── datasetRepository.js      # CRUD operations for dataset persistence
│   │   └── conversationRepository.js # CRUD for conversation threads & messages
│   ├── services/
│   │   ├── duckdbEngine.js           # DuckDB in-memory SQL execution engine
│   │   ├── queryParser.js            # Groq AI query-to-operation translator
│   │   ├── queryValidator.js         # Security & column validation guard
│   │   ├── fallbackExecutor.js       # Resilient JS analytical fallback
│   │   └── dataProfiler.js           # CSV schema profiling & type inference
│   ├── scratch/                      # Automated test suites & seeding scripts
│   │   ├── seed-full-mockup-data.js
│   │   ├── test-stage4-persistence.js
│   │   ├── test-stage4-5-e2e-workflows.js
│   │   └── test-new-conversation-isolation.js
│   └── server.js                     # Express server entry point & route definitions
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/                 # ConversationView, MessageBubble, ChartRenderer, ChatComposer
│   │   │   ├── layout/               # Sidebar, TopNav, DatasetContextBar
│   │   │   ├── panels/               # DatasetOverviewPanel
│   │   │   └── views/                # DashboardOverview, DatasetsView, SchemaView, PreviewView, InsightsView, ReportsView, AiRobotIllustration
│   │   ├── utils/                    # API helpers & currency/number formatters
│   │   ├── App.jsx                   # Central workspace router & application state
│   │   ├── index.css                 # Cinematic dark theme tokens & scrollbar styles
│   │   └── main.jsx                  # React DOM entry
│   ├── tailwind.config.js            # Theme extensions, glows & border tokens
│   └── vite.config.js                # Vite build configuration
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Groq API Key**: Obtain a free key from [Groq Console](https://console.groq.com/)

---

### 1. Installation

Clone the repository and install dependencies for both the backend and frontend:

```bash
# Clone the repository
git clone https://github.com/saquib-17/ai-data-analyst-dashboard.git
cd ai-data-analyst-dashboard

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

---

### 2. Environment Configuration

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

*(Optional: An mock mode is built-in. If no Groq API key is supplied, the backend uses query pattern matching with full DuckDB execution).*

---

### 3. Seed Sample Datasets (Optional)

To immediately populate the database with realistic sample datasets (`sales_data_2024.csv`, `customer_data.csv`, `marketing_campaigns.csv`):

```bash
cd backend
node scratch/seed-full-mockup-data.js
```

---

### 4. Running the Development Servers

In two separate terminal windows:

**Terminal 1 — Backend API Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend Client:**
```bash
cd frontend
npm run dev
# Application available at http://localhost:5173
```

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘ N` / `Ctrl+N` | **New Conversation** | Starts a genuinely fresh, unattached chat thread |
| `Ctrl+K` | **Focus Search** | Focuses the global NL query input in the top header |
| `Enter` | **Send Query** | Submits query in Chat Composer or TopNav |
| `Shift + Enter` | **Multiline Input** | Adds a line break in query inputs |
| `Esc` | **Close Modal** | Closes active Pro Upgrade, Settings, or Help modal |

---

## 📡 API Reference

### Datasets Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/datasets` | Returns list of all registered persistent datasets |
| `POST` | `/api/upload` | Ingests a new CSV file (`multipart/form-data`) and profiles schema |
| `GET` | `/api/dataset/:id/schema` | Returns column types, statistics, data quality, and sample rows |
| `DELETE` | `/api/datasets/:id` | Cascades deletion: drops DuckDB table, removes CSV, deletes DB record |

### Conversations Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/conversations` | Returns all saved conversation threads ordered by last updated |
| `POST` | `/api/conversations` | Creates a new conversation thread (`{ title, datasetId }`) |
| `GET` | `/api/conversations/:id` | Returns full message history and metadata for a thread |
| `PATCH` | `/api/conversations/:id` | Renames a conversation thread or attaches a dataset |
| `DELETE` | `/api/conversations/:id` | Deletes conversation thread and cascades to all child messages |

### Analytical Processing Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Processes natural language question with DuckDB execution |

**Example Request Payload (`POST /api/analyze`):**
```json
{
  "query": "Show me the top 5 products by revenue",
  "datasetId": "f41c8197-9960-4659-a3b3-f178ca094acc",
  "conversationId": "9e33b08e-72c9-4191-ba82-c2dee1ad5455"
}
```

**Example Analytical Response:**
```json
{
  "summary": "The top 5 products by revenue are MacBook Pro ($186K), iPhone 15 ($142K), Nike Shoes ($86K), Coffee Maker ($78K), and Office Chair ($64K).",
  "metrics": {
    "totalRevenue": 1248932,
    "totalOrders": 12480,
    "uniqueCustomers": 4892,
    "avgOrderValue": 100.08
  },
  "chart": {
    "recommended": "horizontal-bar",
    "title": "Top 5 Products by Revenue",
    "data": [
      { "Product": "MacBook Pro", "Revenue": 186420 },
      { "Product": "iPhone 15", "Revenue": 142300 },
      { "Product": "Nike Shoes", "Revenue": 86120 },
      { "Product": "Coffee Maker", "Revenue": 78450 },
      { "Product": "Office Chair", "Revenue": 64200 }
    ]
  },
  "sql": "SELECT Product, SUM(Revenue) AS Revenue FROM dataset_sales GROUP BY Product ORDER BY Revenue DESC LIMIT 5",
  "followUpSuggestions": [
    "Show profit margins for these products",
    "Compare with previous year",
    "Break down by region"
  ]
}
```

---

## 🧪 Automated Testing & Verification

The codebase includes comprehensive automated test suites covering persistence, isolation, and end-to-end user workflows:

```bash
# 1. Run Stage 4.5 End-to-End Workflow Verification (14/14 tests)
node backend/scratch/test-stage4-5-e2e-workflows.js

# 2. Run Stage 4 SQLite Persistence & Durability Tests (19/19 tests)
node backend/scratch/test-stage4-persistence.js

# 3. Run New Conversation Dataset Isolation Verification
node backend/scratch/test-new-conversation-isolation.js

# 4. Verify Frontend Production Build
npm run build --prefix frontend
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
