# AI Data Analyst Dashboard

A powerful full-stack application that transforms raw CSV data into actionable insights using Artificial Intelligence. Upload your datasets, ask questions in plain English, and receive structured analysis, interactive charts, and AI-generated summaries instantly.

## 🚀 Key Features

- **CSV Data Upload**: Seamlessly upload and parse CSV files with instant previews.
- **Natural Language Querying**: Query your data using plain English (e.g., "Show me the top 5 sales in March").
- **AI-Powered Analysis**: Uses Groq (Llama 3.3) to translate natural language into structured data operations (filtering, aggregation, grouping).
- **Dynamic Visualizations**: Automatically generates relevant charts (Bar, Line, Area, etc.) based on your query results using Recharts.
- **Smart Insights**: AI-generated human-readable summaries that highlight key trends and data points.
- **Modern UI**: A clean, responsive dashboard built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: Groq Cloud API (Llama 3.3 model via OpenAI SDK)
- **File Handling**: Multer & CSV-Parser

## 📂 Project Structure

```text
ai-dashboard/
├── backend/            # Express server & AI services
│   ├── services/       # Query parsing & data processing logic
│   ├── uploads/        # Temporary storage for uploaded CSVs
│   └── server.js       # Main server entry point
├── frontend/           # React client application
│   ├── src/
│   │   ├── components/ # UI Components & Chart wrappers
│   │   ├── utils/      # Client-side helpers
│   │   └── App.jsx     # Main application layout
└── README.md           # Project documentation
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Groq Cloud API Key ([Get it here](https://console.groq.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-dashboard
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

## 📡 API Endpoints

- `POST /api/upload`: Upload and parse a CSV file.
- `POST /api/analyze`: Process a natural language query against the current dataset.
- `POST /api/query-to-json`: (Internal) Convert natural language query to structured JSON.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
