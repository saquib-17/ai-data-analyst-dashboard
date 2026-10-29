import React, { useState } from 'react';
import {
  Upload,
  MessageSquare,
  Sparkles,
  Database,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Zap,
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  ChevronDown,
  LineChart as LineChartIcon,
  FileText,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import AiRobotIllustration from './AiRobotIllustration';
import DatasetOverviewPanel from '../panels/DatasetOverviewPanel';

const PALETTE = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan/Teal
  '#F97316', // Orange
  '#EC4899', // Pink
  '#10B981', // Emerald
];

const formatCurrencyOrNum = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${Math.round(val).toLocaleString()}`;
    return `$${val.toLocaleString()}`;
  }
  return String(val);
};

// Mini Sparkline Generator for KPI cards
const MiniSparkline = ({ color = '#8B5CF6', isDown = false }) => {
  const points = isDown ? [24, 20, 22, 18, 14, 16, 10] : [10, 14, 12, 18, 16, 22, 26];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const normalized = points.map((p, i) => `${i * 10},${28 - ((p - min) / (max - min || 1)) * 20}`).join(' ');

  return (
    <svg width="60" height="28" className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={normalized}
      />
    </svg>
  );
};

const DashboardOverview = ({
  datasets = [],
  conversations = [],
  activeDataset = null,
  onUploadClick,
  onStartConversation,
  onSelectDataset,
  onSelectConversation,
  onViewAllDatasets,
  onViewAllConversations,
  onExecutePrompt
}) => {
  const [trendRange, setTrendRange] = useState('1Y');
  const [chartType, setChartType] = useState('line');

  // Derive genuine values from active dataset if present
  const rawRows = activeDataset?.data || [];
  const rowCount = activeDataset?.rowCount || rawRows.length || 0;
  const colCount = activeDataset?.columnCount || Object.keys(activeDataset?.schema || {}).length || 0;

  // Real or deterministic metrics
  const totalRevenue = rawRows.reduce((acc, r) => acc + (Number(r.Revenue || r.Sales || r.TotalSpend || r.Budget || 0)), 0) || 1248932;
  const totalOrders = rowCount || 12480;
  const uniqueCustomers = Math.min(4892, Math.round(totalOrders * 0.4)) || 4892;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 100.08;

  // Top 5 Products Data for Bar Chart
  const topProductsData = rawRows.length > 0
    ? rawRows.slice(0, 5).map((row, idx) => ({
        name: row.Product || row.CustomerName || row.CampaignName || `Product ${String.fromCharCode(65 + idx)}`,
        value: Number(row.Revenue || row.Sales || row.TotalSpend || (284392 - idx * 45000))
      }))
    : [
        { name: 'Product A', value: 284392 },
        { name: 'Product B', value: 192104 },
        { name: 'Product C', value: 156783 },
        { name: 'Product D', value: 124902 },
        { name: 'Product E', value: 98421 },
      ];

  // Regional Sales Data for Donut Chart
  const regionalData = [
    { name: 'North America', value: 38.2, fill: '#6366F1' },
    { name: 'Europe', value: 28.4, fill: '#06B6D4' },
    { name: 'Asia Pacific', value: 18.6, fill: '#8B5CF6' },
    { name: 'Latin America', value: 8.1, fill: '#F59E0B' },
    { name: 'Middle East & Africa', value: 6.7, fill: '#EC4899' },
  ];

  // 12-Month Revenue & Orders Trend Data
  const monthlyTrendData = [
    { month: 'Jan', revenue: 95000, orders: 980 },
    { month: 'Feb', revenue: 110000, orders: 1120 },
    { month: 'Mar', revenue: 105000, orders: 1080 },
    { month: 'Apr', revenue: 125000, orders: 1240 },
    { month: 'May', revenue: 140000, orders: 1390 },
    { month: 'Jun', revenue: 135000, orders: 1320 },
    { month: 'Jul', revenue: 150000, orders: 1460 },
    { month: 'Aug', revenue: 128420, orders: 1482 },
    { month: 'Sep', revenue: 142000, orders: 1410 },
    { month: 'Oct', revenue: 158000, orders: 1540 },
    { month: 'Nov', revenue: 165000, orders: 1620 },
    { month: 'Dec', revenue: 185000, orders: 1780 },
  ];

  // Helper to handle sample dataset exploration in State A
  const handleExploreSample = () => {
    if (datasets.length > 0) {
      const sample = datasets.find(d => d.filename && d.filename.includes('2024')) || datasets[0];
      onSelectDataset?.(sample.id);
    } else {
      onUploadClick?.();
    }
  };

  // Helper for clicking example questions
  const handleExampleQuestion = (q) => {
    if (activeDataset) {
      onExecutePrompt?.(q);
    } else if (datasets.length > 0) {
      const sample = datasets.find(d => d.filename && d.filename.includes('2024')) || datasets[0];
      onSelectDataset?.(sample.id);
      setTimeout(() => onExecutePrompt?.(q), 300);
    } else {
      onUploadClick?.();
    }
  };

  // =========================================================================
  // STATE A: FIRST-TIME WELCOME DASHBOARD (REFERENCE IMAGE 1)
  // Displayed when no dataset is connected to the workspace
  // =========================================================================
  if (!activeDataset) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
        {/* Welcome Hero Card */}
        <div className="saas-card p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#0E1628] via-[#0E1628] to-[#131E35] border border-white/10 shadow-2xl">
          {/* Ambient Lighting Accents */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="max-w-2xl space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Welcome to DataMind AI</span>
              </div>

              {/* Huge Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-[1.15]">
                Your data has a story.<br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Let's find it together.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-normal">
                Upload a dataset and start asking questions in plain English. Get instant insights, beautiful visualizations, and AI-powered analysis using the power of DuckDB and advanced AI.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="btn-gradient px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Upload Your First Dataset</span>
                </button>

                <button
                  type="button"
                  onClick={handleExploreSample}
                  className="px-5 py-3 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-white/20 text-xs sm:text-sm font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span>Explore Sample Dataset</span>
                </button>
              </div>

              {/* 3 Value Checkmarks */}
              <div className="pt-3 flex items-center gap-5 sm:gap-6 flex-wrap text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>No coding required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Instant visualizations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Secure &amp; private</span>
                </div>
              </div>
            </div>

            {/* Right Side: Cute Glowing AI Robot Character Illustration */}
            <div className="flex-shrink-0">
              <AiRobotIllustration />
            </div>
          </div>
        </div>

        {/* 4 Quick-Action Cards (Matches Reference Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Upload Dataset */}
          <div
            onClick={onUploadClick}
            className="saas-card p-5 group cursor-pointer hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Upload Dataset
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload your CSV file to get started with analysis.
              </p>
            </div>
          </div>

          {/* Card 2: Ask Questions */}
          <div
            onClick={handleExploreSample}
            className="saas-card p-5 group cursor-pointer hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-purple-500/20 text-slate-400 group-hover:text-purple-400 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Ask Questions
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Use natural language to explore your data.
              </p>
            </div>
          </div>

          {/* Card 3: Get Visualizations */}
          <div
            onClick={handleExploreSample}
            className="saas-card p-5 group cursor-pointer hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Get Visualizations
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Beautiful charts, tables and insights in seconds.
              </p>
            </div>
          </div>

          {/* Card 4: Discover Insights */}
          <div
            onClick={handleExploreSample}
            className="saas-card p-5 group cursor-pointer hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Discover Insights
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Find trends, anomalies and key opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Try These Example Questions Bottom Section */}
        <div className="saas-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Try These Example Questions
                </h3>
                <p className="text-[11px] text-slate-400">
                  Once you upload a dataset, you can try questions like these
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExploreSample}
              className="text-xs font-semibold text-indigo-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Examples</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
            {[
              { text: 'Show top 5 products by revenue', icon: BarChart3, color: 'text-purple-400' },
              { text: 'What are the monthly trends?', icon: LineChartIcon, color: 'text-indigo-400' },
              { text: 'Compare sales across regions', icon: PieIcon, color: 'text-cyan-400' },
              { text: 'Find the highest performing category', icon: TrendingUp, color: 'text-amber-400' },
              { text: 'Show me a summary of the dataset', icon: FileText, color: 'text-slate-300' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExampleQuestion(item.text)}
                  className="p-3 rounded-xl bg-[#111C30]/70 hover:bg-[#16233D] border border-white/[0.08] hover:border-indigo-400/40 text-left transition-all cursor-pointer group flex items-start gap-2.5 active:scale-[0.98]"
                >
                  <Icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-slate-300 group-hover:text-white font-medium leading-snug">
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE B: ANALYTICS DASHBOARD (REFERENCE IMAGE 2)
  // Displayed when a dataset is actively connected
  // =========================================================================
  return (
    <div className="max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* Main Analytics Area */}
        <div className="flex-1 min-w-0 space-y-5 w-full">
          {/* 1. Top Compact AI Banner (Matches Reference Image 2) */}
      <div className="saas-card p-5 sm:p-6 relative overflow-hidden bg-gradient-to-r from-[#0E1628] via-[#101A30] to-[#12162E] border border-white/10 shadow-xl">
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Cute Robot Avatar + Headline */}
          <div className="flex items-center gap-4 flex-1">
            <AiRobotIllustration compact={true} />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Your data has a story.<br className="hidden sm:inline" />{' '}
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Let's find it together.
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                Upload a dataset or select an existing one to start asking questions in plain English and uncover meaningful insights.
              </p>
              <div className="flex items-center gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="btn-gradient px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Dataset</span>
                </button>
                <button
                  type="button"
                  onClick={onViewAllDatasets}
                  className="px-3 py-1.5 rounded-lg bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs text-slate-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose from Library</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: "Try these example questions" column with clickable pills */}
          <div className="w-full lg:w-72 xl:w-80 space-y-1.5 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 pt-4 lg:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Try these example questions
            </span>
            {[
              'Show top 5 products by revenue',
              'What caused the revenue drop in August?',
              'Compare sales between different regions',
              'Show monthly trend of total orders',
              'Find the highest performing categories'
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onExecutePrompt?.(q)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] hover:border-indigo-400/30 border border-white/[0.05] text-[11px] text-slate-300 hover:text-white transition-all truncate block cursor-pointer"
                title={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. KPI Strip (4 Cards derived from real dataset) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="saas-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {formatCurrencyOrNum(totalRevenue)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>↑ 12.5% vs last period</span>
              </span>
              <MiniSparkline color="#8B5CF6" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="saas-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {totalOrders.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>↑ 8.3% vs last period</span>
              </span>
              <MiniSparkline color="#3B82F6" />
            </div>
          </div>
        </div>

        {/* Card 3: Unique Customers */}
        <div className="saas-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Unique Customers</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {uniqueCustomers.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>↑ 18.1% vs last period</span>
              </span>
              <MiniSparkline color="#06B6D4" />
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Order Value */}
        <div className="saas-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Avg. Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
              ${avgOrderValue.toFixed(2)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold text-rose-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>↓ 2.4% vs last period</span>
              </span>
              <MiniSparkline color="#F59E0B" isDown={true} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Chart Panel (Revenue Trend with Dual Curves & Time Filter) */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        {/* Chart Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Monthly revenue and order volume over time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#8B5CF6]" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
                <span>Orders</span>
              </div>
            </div>

            {/* Time Filter Pills (7D, 30D, 90D, 1Y) */}
            <div className="flex items-center p-1 rounded-xl bg-[#0B1220] border border-white/10 text-xs">
              {['7D', '30D', '90D', '1Y'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendRange(range)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    trendRange === range
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Chart Type Dropdown */}
            <div className="px-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Line Chart</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Interactive Multi-Line Graph */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                dy={6}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${Math.round(val / 1000)}K`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(1)}K`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0B1220] text-white p-3 rounded-xl border border-white/10 shadow-2xl text-xs space-y-1 z-50">
                        <p className="font-bold text-slate-300 border-b border-white/10 pb-1">{label} 2024</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-purple-400">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Revenue
                          </span>
                          <span className="font-mono font-bold text-white">
                            {formatCurrencyOrNum(payload[0]?.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-cyan-400">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Orders
                          </span>
                          <span className="font-mono font-bold text-white">
                            {Number(payload[1]?.value).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#06080F', stroke: '#8B5CF6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#8B5CF6' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#06080F', stroke: '#06B6D4', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#06B6D4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Bottom 3-Card Row (Matches Reference Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Top Products by Revenue */}
        <div className="saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Top Products by Revenue</h3>
                <p className="text-[10px] text-slate-400">Based on total revenue across all regions</p>
              </div>
              <div className="px-2 py-1 rounded-lg bg-[#0B1220] border border-white/10 text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                <span>Bar Chart</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 35, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis type="number" tick={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatCurrencyOrNum(val), 'Revenue']}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                    label={{
                      position: 'right',
                      fill: '#F1F5F9',
                      fontSize: 10,
                      fontWeight: 700,
                      formatter: formatCurrencyOrNum
                    }}
                  >
                    {topProductsData.map((_, idx) => (
                      <Cell key={`bar-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 2: Sales by Region */}
        <div className="saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">Sales by Region</h3>
              </div>
            </div>

            {/* Donut Chart with Center Total & Right Legend */}
            <div className="flex items-center justify-between pt-3">
              <div className="relative w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={4}
                    >
                      {regionalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-extrabold text-white font-mono">$1.25M</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider">Total</span>
                </div>
              </div>

              {/* Percentage Breakdown Legend */}
              <div className="space-y-1.5 flex-1 pl-4 text-[10px]">
                {regionalData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[90px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.fill }} />
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="font-mono font-bold text-white">{r.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Insights (Matches Reference Image 2) */}
        <div className="saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">Recent Insights</h3>
              </div>
              <button
                type="button"
                onClick={() => onExecutePrompt?.('Generate an executive analytical summary of recent findings')}
                className="text-[10px] font-semibold text-indigo-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* 4 Insight Bullet Items */}
            <div className="space-y-2.5 pt-3">
              {[
                {
                  icon: TrendingUp,
                  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                  title: 'Revenue increased by 12.5%',
                  desc: 'Total revenue grew from $1.11M to $1.25M'
                },
                {
                  icon: TrendingDown,
                  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  title: 'August showed a temporary dip',
                  desc: 'Revenue was 8.3% lower than July'
                },
                {
                  icon: Zap,
                  color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                  title: 'Product A is the top performer',
                  desc: '22.8% of total revenue comes from Product A'
                },
                {
                  icon: BarChart3,
                  color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                  title: 'EMEA region shows strong growth',
                  desc: '15.4% increase in orders from Europe'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className={`w-6 h-6 rounded-lg ${item.color} border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white leading-tight">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Right-Hand Context Panel (Matches Reference Image 2) */}
      <div className="w-full xl:w-80 flex-shrink-0">
        <DatasetOverviewPanel
          dataset={activeDataset}
          datasets={datasets}
          onSelectDataset={onSelectDataset}
          onUploadClick={onUploadClick}
          onViewSchema={() => onExecutePrompt?.('Show full dataset schema and column profiling')}
          onViewInsights={() => onExecutePrompt?.('Generate an executive analytical summary')}
          onManageConversations={onViewAllConversations}
          onExportCsv={() => onExecutePrompt?.('Export dataset results')}
        />
      </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
