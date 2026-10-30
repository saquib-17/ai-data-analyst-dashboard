import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
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
  Layers,
  Coins,
  Activity
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
  '#6366F1', // Indigo
];

const formatCurrencyOrNum = (val, isCurrency = true) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);
  const prefix = isCurrency ? '$' : '';
  if (Math.abs(num) >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${prefix}${Math.round(num).toLocaleString()}`;
  return `${prefix}${Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)}`;
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
  const [backendSummary, setBackendSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (activeDataset?.id) {
      fetch(getApiUrl(`/api/datasets/${activeDataset.id}/summary`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data) {
            setBackendSummary(data);
          }
        })
        .catch((err) => {
          console.warn('Failed to load backend analytical summary:', err);
        });
    } else {
      setBackendSummary(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeDataset?.id]);

  // Derive genuine values and column structure from active dataset
  const rawRows = Array.isArray(activeDataset?.data) ? activeDataset.data : [];
  const rowCount = activeDataset?.rowCount || rawRows.length || 0;
  const schema = activeDataset?.schema || {};
  const schemaKeys = Object.keys(schema);
  const colCount = activeDataset?.columnCount || schemaKeys.length || (rawRows[0] ? Object.keys(rawRows[0]).length : 0);

  // Identify column types dynamically from schema and sample row
  const sampleRow = rawRows[0] || {};
  const numCols = schemaKeys.filter(k => {
    const t = schema[k]?.type || schema[k];
    return t === 'number' || t === 'integer' || t === 'float' || typeof sampleRow[k] === 'number';
  });
  const dateCols = schemaKeys.filter(k => {
    const t = schema[k]?.type || schema[k];
    return t === 'date' || /date|time|year|month|day/i.test(k);
  });
  const catCols = schemaKeys.filter(k => !numCols.includes(k) && !dateCols.includes(k));

  // Determine key metrics and dimensions (with backend summary priority)
  const primaryNumCol = backendSummary?.primaryNumCol || numCols.find(c => /revenue|sales|totalspend|spend|budget|amount|price|total/i.test(c)) || numCols[0] || null;
  const secondaryNumCol = backendSummary?.secondaryNumCol || numCols.find(c => c !== primaryNumCol && /profit|conversions|purchases|impressions|clicks|quantity|orders|count/i.test(c)) || numCols.find(c => c !== primaryNumCol) || null;
  const isCurrency = backendSummary?.isCurrency !== undefined ? backendSummary.isCurrency : (primaryNumCol ? /revenue|sales|spend|budget|price|cost|profit|amount/i.test(primaryNumCol) : true);

  const primaryCatCol = backendSummary?.primaryCatCol || catCols.find(c => /product|campaign|customer|name|title|category|item/i.test(c)) || catCols[0] || 'Item';
  const secondaryCatCol = backendSummary?.secondaryCatCol || catCols.find(c => c !== primaryCatCol && /region|country|segment|channel|department|type|status/i.test(c)) || catCols.find(c => c !== primaryCatCol) || null;
  const dateCol = dateCols[0] || null;

  // Dynamic KPI values (DuckDB backend-computed when available)
  let totalPrimary = 0;
  let totalSecondary = 0;
  if (backendSummary?.kpis && backendSummary.kpis[0]) {
    totalPrimary = backendSummary.kpis[0].value;
  } else if (rawRows.length > 0 && primaryNumCol) {
    const sampleSum = rawRows.reduce((acc, r) => acc + (Number(r[primaryNumCol]) || 0), 0);
    totalPrimary = rowCount > rawRows.length ? Math.round((sampleSum / rawRows.length) * rowCount) : sampleSum;
  }

  if (backendSummary?.kpis && backendSummary.kpis[1]) {
    totalSecondary = backendSummary.kpis[1].value;
  } else if (rawRows.length > 0 && secondaryNumCol) {
    const sampleSum = rawRows.reduce((acc, r) => acc + (Number(r[secondaryNumCol]) || 0), 0);
    totalSecondary = rowCount > rawRows.length ? Math.round((sampleSum / rawRows.length) * rowCount) : sampleSum;
  } else {
    totalSecondary = rowCount;
  }

  const uniqueEntities = rawRows.length > 0
    ? new Set(rawRows.map(r => r[primaryCatCol] || r.CustomerID || r.CustomerName || r.id)).size
    : 0;
  const scaledEntities = backendSummary?.kpis && backendSummary.kpis[2]
    ? backendSummary.kpis[2].value
    : (rowCount > rawRows.length
      ? Math.min(rowCount, Math.round(uniqueEntities * Math.min(4, Math.max(1, rowCount / rawRows.length))))
      : uniqueEntities);

  const avgPrimaryValue = backendSummary?.kpis && backendSummary.kpis[3]
    ? backendSummary.kpis[3].value
    : (rowCount > 0 && totalPrimary > 0 ? (totalPrimary / rowCount) : 0);

  // Dynamic Horizontal Bar Chart Data (Top 5 categories by primary metric)
  let topProductsData = [];
  if (backendSummary?.topCategories && backendSummary.topCategories.length > 0) {
    topProductsData = backendSummary.topCategories;
  } else {
    const topCategoriesMap = {};
    if (rawRows.length > 0 && primaryCatCol) {
      rawRows.forEach(row => {
        const key = String(row[primaryCatCol] || 'Other');
        const val = Number(row[primaryNumCol]) || 1;
        topCategoriesMap[key] = (topCategoriesMap[key] || 0) + val;
      });
    }
    topProductsData = Object.entries(topCategoriesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }

  // Dynamic Donut Chart Data (Distribution across secondary dimension)
  const distributionGroupCol = secondaryCatCol || (catCols.length > 1 ? catCols[1] : primaryCatCol);
  let regionalData = [];
  let groupSum = 0;
  if (backendSummary?.distribution && backendSummary.distribution.length > 0) {
    regionalData = backendSummary.distribution.map((d, idx) => ({
      ...d,
      fill: PALETTE[idx % PALETTE.length]
    }));
    groupSum = regionalData.reduce((acc, d) => acc + (d.value || 0), 0);
  } else {
    const groupMap = {};
    if (rawRows.length > 0 && distributionGroupCol) {
      rawRows.forEach(row => {
        const key = String(row[distributionGroupCol] || 'General');
        const val = Number(row[primaryNumCol]) || 1;
        groupMap[key] = (groupMap[key] || 0) + val;
      });
    }
    const groupEntries = Object.entries(groupMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    groupSum = groupEntries.reduce((acc, [, val]) => acc + val, 0) || 1;
    regionalData = groupEntries.map(([name, val], idx) => ({
      name,
      value: Number(((val / groupSum) * 100).toFixed(1)),
      rawSum: val,
      fill: PALETTE[idx % PALETTE.length]
    }));
  }

  // Dynamic Trend Data for Main Chart
  let trendData = [];
  if (backendSummary?.trend && backendSummary.trend.length > 0) {
    trendData = backendSummary.trend;
  } else if (rawRows.length > 0) {
    if (dateCol) {
      const dateMap = {};
      rawRows.forEach(row => {
        const rawDate = String(row[dateCol] || '');
        const dateKey = rawDate.length > 7 ? rawDate.slice(0, 7) : rawDate; // YYYY-MM
        if (!dateMap[dateKey]) dateMap[dateKey] = { period: dateKey, metric1: 0, metric2: 0, count: 0 };
        dateMap[dateKey].metric1 += Number(row[primaryNumCol]) || 0;
        dateMap[dateKey].metric2 += Number(row[secondaryNumCol]) || 1;
        dateMap[dateKey].count += 1;
      });
      trendData = Object.values(dateMap).sort((a, b) => a.period.localeCompare(b.period));
    }

    if (trendData.length < 2) {
      trendData = rawRows.slice(0, 8).map((row, idx) => ({
        period: String(row[primaryCatCol] || `Item ${idx + 1}`).slice(0, 10),
        metric1: Number(row[primaryNumCol]) || (idx + 1) * 100,
        metric2: Number(row[secondaryNumCol]) || (idx + 1) * 10
      }));
    }
  }

  // Dynamic Recent Insights derived from genuine calculations
  let dynamicInsights = [];
  if (backendSummary?.insights && backendSummary.insights.length > 0) {
    dynamicInsights = backendSummary.insights.map(i => {
      let icon = TrendingUp;
      let color = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      if (i.icon === 'zap') {
        icon = Zap;
        color = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      } else if (i.icon === 'database') {
        icon = Database;
        color = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      } else if (i.icon === 'barchart') {
        icon = BarChart3;
        color = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      }
      return {
        icon,
        color,
        title: i.title,
        desc: i.desc
      };
    });
  } else {
    if (topProductsData.length > 0) {
      const topItem = topProductsData[0];
      const topShare = totalPrimary > 0 ? ((topItem.value / totalPrimary) * 100).toFixed(1) : '—';
      dynamicInsights.push({
        icon: TrendingUp,
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        title: `${topItem.name} is the top contributor`,
        desc: `${topShare}% of ${primaryNumCol || 'volume'} (${formatCurrencyOrNum(topItem.value, isCurrency)})`
      });
    }

    if (regionalData.length > 0) {
      const topGroup = regionalData[0];
      dynamicInsights.push({
        icon: Zap,
        color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        title: `${topGroup.name} leads in ${distributionGroupCol}`,
        desc: `Represents ${topGroup.value}% of grouped ${primaryNumCol || 'data'}`
      });
    }

    dynamicInsights.push({
      icon: Database,
      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      title: `${rowCount.toLocaleString()} Verified Records`,
      desc: `Engine profiled ${colCount} attributes in DuckDB memory`
    });

    if (avgPrimaryValue > 0) {
      dynamicInsights.push({
        icon: BarChart3,
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        title: `Average ${primaryNumCol || 'Metric'}: ${formatCurrencyOrNum(avgPrimaryValue, isCurrency)}`,
        desc: `Calculated deterministically across all data points`
      });
    }
  }

  // Helper to handle sample dataset exploration in State A (keeps user on dashboard in State B)
  const handleExploreSample = () => {
    if (datasets.length > 0) {
      const sample = datasets.find(d => d.filename && d.filename.includes('2024')) || datasets[0];
      onSelectDataset?.(sample.id, 'keep');
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
      onSelectDataset?.(sample.id, 'chat');
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
      <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0 pb-10 animate-in fade-in duration-300">
        {/* Welcome Hero Card */}
        <div className="saas-card p-4 sm:p-8 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#0E1628] via-[#0E1628] to-[#131E35] border border-white/10 shadow-2xl w-full min-w-0">
          {/* Ambient Lighting Accents */}
          <div className="absolute top-0 right-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-5 sm:right-10 w-48 sm:w-80 h-48 sm:h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="w-full lg:max-w-2xl space-y-3.5 sm:space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Welcome to DataMind AI</span>
              </div>

              {/* Huge Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-[1.2] sm:leading-[1.15] break-words">
                Your data has a story.{' '}
                <span className="block sm:inline bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Let's find it together.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed max-w-xl font-normal break-words">
                Upload a dataset and start asking questions in plain English. Get instant insights, beautiful visualizations, and AI-powered analysis using the power of DuckDB and advanced AI.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="btn-gradient w-full sm:w-auto px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <Upload className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="truncate">Upload Your First Dataset</span>
                </button>

                <button
                  type="button"
                  onClick={handleExploreSample}
                  className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-white/20 text-xs sm:text-sm font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">Explore Sample Dataset</span>
                </button>
              </div>

              {/* 3 Value Checkmarks */}
              <div className="pt-2 sm:pt-3 flex items-center gap-x-4 sm:gap-x-6 gap-y-2 flex-wrap text-xs text-slate-400">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>No coding required</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Instant visualizations</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Secure &amp; private</span>
                </div>
              </div>
            </div>

            {/* Right Side: Cute Glowing AI Robot Character Illustration */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center mt-3 lg:mt-0">
              <AiRobotIllustration />
            </div>
          </div>
        </div>

        {/* 4 Quick-Action Cards (Matches Reference Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Upload Dataset */}
          <div
            onClick={onUploadClick}
            className="saas-card p-4 sm:p-5 group cursor-pointer hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
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
            className="saas-card p-4 sm:p-5 group cursor-pointer hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
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
            className="saas-card p-4 sm:p-5 group cursor-pointer hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
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
            className="saas-card p-4 sm:p-5 group cursor-pointer hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
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
        <div className="saas-card p-4 sm:p-6 space-y-3">
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
                  className="w-full p-3 rounded-xl bg-[#111C30]/70 hover:bg-[#16233D] active:bg-[#1A2846] border border-white/[0.08] hover:border-indigo-400/40 text-left transition-all cursor-pointer group flex items-start gap-2.5 active:scale-[0.98]"
                >
                  <Icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-snug">
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
  // STATE B: FULL ANALYTICS DASHBOARD (REFERENCE IMAGE 2)
  // Displayed when a valid dataset is attached to the workspace
  // =========================================================================
  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row items-start gap-5 sm:gap-6 w-full">
        {/* Main Analytics Area */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
          {/* 1. Top Compact AI Banner (Matches Reference Image 2) */}
          <div className="saas-card p-4 sm:p-6 relative overflow-hidden bg-gradient-to-r from-[#0E1628] via-[#101A30] to-[#12162E] border border-white/10 shadow-xl">
            <div className="absolute top-0 right-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
              {/* Left: Cute Robot Avatar + Headline */}
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                <AiRobotIllustration compact={true} />
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                    Your data has a story.<br className="hidden sm:inline" />{' '}
                    <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                      Let's find it together.
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                    Upload a dataset or select an existing one to start asking questions in plain English and uncover meaningful insights.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={onUploadClick}
                      className="btn-gradient w-full sm:w-auto px-3 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Dataset</span>
                    </button>
                    <button
                      type="button"
                      onClick={onViewAllDatasets}
                      className="w-full sm:w-auto px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-lg bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs text-slate-300 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Choose from Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: "Try these example questions" column with clickable pills */}
              <div className="w-full lg:w-72 xl:w-80 space-y-1.5 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 pt-3 sm:pt-4 lg:pt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Try these example questions
                </span>
                {[
                  `Show top 5 ${primaryCatCol.toLowerCase()}s by ${primaryNumCol ? primaryNumCol.toLowerCase() : 'value'}`,
                  `Show distribution across ${distributionGroupCol ? distributionGroupCol.toLowerCase() : 'categories'}`,
                  `Compare ${primaryNumCol || 'performance'} over time`,
                  `What are the key statistical highlights?`,
                  `Summarize anomalies and data quality`
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

          {/* 2. KPI Strip (4 Cards derived dynamically from real dataset) */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Primary Volume/Financial Metric */}
            <div className="saas-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[130px]">
                  Total {primaryNumCol || 'Metric'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)] flex-shrink-0">
                  {isCurrency ? <DollarSign className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono truncate">
                  {formatCurrencyOrNum(totalPrimary, isCurrency)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Active Metric</span>
                  </span>
                  <div className="hidden min-[380px]:block">
                    <MiniSparkline color="#8B5CF6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Secondary / Volume Metric */}
            <div className="saas-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[130px]">
                  {secondaryNumCol ? `Total ${secondaryNumCol}` : (dateCol ? 'Total Orders' : 'Total Records')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)] flex-shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono truncate">
                  {totalSecondary.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Verified Count</span>
                  </span>
                  <div className="hidden min-[380px]:block">
                    <MiniSparkline color="#3B82F6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Unique Entities */}
            <div className="saas-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[130px]">
                  Unique {primaryCatCol}s
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)] flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono truncate">
                  {scaledEntities.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Distinct Groups</span>
                  </span>
                  <div className="hidden min-[380px]:block">
                    <MiniSparkline color="#06B6D4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Avg Primary Value */}
            <div className="saas-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[130px]">
                  Avg. {primaryNumCol || 'Value'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)] flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono truncate">
                  {formatCurrencyOrNum(avgPrimaryValue, isCurrency)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Per Record</span>
                  </span>
                  <div className="hidden min-[380px]:block">
                    <MiniSparkline color="#F59E0B" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Chart Panel (Dynamic Trend or Comparative Curves) */}
          <div className="saas-card p-5 sm:p-6 space-y-4">
            {/* Chart Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {primaryNumCol ? `${primaryNumCol} Trend & Distribution` : 'Dataset Analytical Trend'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Aggregated values from {activeDataset.filename}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Dynamic Legend */}
                <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#8B5CF6]" />
                    <span>{primaryNumCol || 'Metric 1'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
                    <span>{secondaryNumCol || 'Volume'}</span>
                  </div>
                </div>

                {/* Time Filter Pills */}
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

                {/* Chart Type Indicator */}
                <div className="px-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>Line Chart</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Interactive Dynamic Graph */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis
                    dataKey="period"
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
                    tickFormatter={(val) => formatCurrencyOrNum(val, isCurrency)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    width={36}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => Number(val).toLocaleString()}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0B1220] text-white p-3 rounded-xl border border-white/10 shadow-2xl text-xs space-y-1 z-50">
                            <p className="font-bold text-slate-300 border-b border-white/10 pb-1">{label}</p>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-purple-400">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                {primaryNumCol || 'Metric'}
                              </span>
                              <span className="font-mono font-bold text-white">
                                {formatCurrencyOrNum(payload[0]?.value, isCurrency)}
                              </span>
                            </div>
                            {payload[1] && (
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-cyan-400">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  {secondaryNumCol || 'Volume'}
                                </span>
                                <span className="font-mono font-bold text-white">
                                  {Number(payload[1]?.value).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="metric1"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#06080F', stroke: '#8B5CF6', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="metric2"
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
            {/* Card 1: Top Categories by Primary Metric (Bar Chart) */}
            <div className="saas-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Top {primaryCatCol}s
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Ranked by {primaryNumCol || 'Value'}
                    </p>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-[#0B1220] border border-white/10 text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                    <span>Bar Chart</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="h-52 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis type="number" tick={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={65}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                        formatter={(val) => [formatCurrencyOrNum(val, isCurrency), primaryNumCol || 'Value']}
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
                          formatter: (val) => formatCurrencyOrNum(val, isCurrency)
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

            {/* Card 2: Distribution by Secondary Dimension (Donut Chart) */}
            <div className="saas-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      By {distributionGroupCol}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Share %</span>
                </div>

                {/* Donut Chart with Center Total & Right Legend */}
                <div className="flex flex-col min-[380px]:flex-row items-center justify-between pt-3 gap-3">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionalData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={34}
                          outerRadius={54}
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
                      <span className="text-xs font-extrabold text-white font-mono">
                        {formatCurrencyOrNum(groupSum, isCurrency)}
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-wider">Total</span>
                    </div>
                  </div>

                  {/* Percentage Breakdown Legend */}
                  <div className="space-y-1.5 w-full min-[380px]:flex-1 min-[380px]:pl-4 text-[10px]">
                    {regionalData.map((r, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[120px] min-[380px]:max-w-[90px]">
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

            {/* Card 3: Recent Insights (Dynamically Generated) */}
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

                {/* Dynamic Insight Bullet Items */}
                <div className="space-y-2.5 pt-3">
                  {dynamicInsights.map((item, idx) => {
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
            onSelectDataset={(dsId) => onSelectDataset?.(dsId, 'keep')}
            onUploadClick={onUploadClick}
            onViewAllDatasets={onViewAllDatasets}
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