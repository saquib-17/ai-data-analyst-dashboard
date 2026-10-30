import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieIcon,
  TrendingUp,
  Table2,
  Download,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Upload,
  FolderOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const PALETTE = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1'  // Indigo
];

const formatVal = (val, isCurrency = false) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);
  const prefix = isCurrency ? '$' : '';
  if (Math.abs(num) >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${prefix}${Math.round(num).toLocaleString()}`;
  return `${prefix}${Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)}`;
};

const ChartStudioView = ({
  dataset,
  onUploadClick,
  onViewDatasets,
  onAskInChat
}) => {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'hbar' | 'line' | 'area' | 'donut'
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [aggFunction, setAggFunction] = useState('sum'); // 'sum' | 'avg' | 'count' | 'max' | 'min'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const rawRows = Array.isArray(dataset?.data) ? dataset.data : [];
  const schema = dataset?.schema || {};
  const schemaKeys = Object.keys(schema);

  // Group columns into numeric and categorical
  const numCols = useMemo(() => {
    return schemaKeys.filter(k => {
      const t = schema[k]?.type || schema[k];
      return t === 'number' || t === 'integer' || t === 'float' || (rawRows[0] && typeof rawRows[0][k] === 'number');
    });
  }, [schemaKeys, schema, rawRows]);

  const catCols = useMemo(() => {
    return schemaKeys.filter(k => !numCols.includes(k));
  }, [schemaKeys, numCols]);

  // Set default dimension and metric when dataset loads
  const activeDim = selectedDimension || catCols[0] || schemaKeys[0] || '';
  const activeMetric = selectedMetric || numCols[0] || '';
  const isCurrencyMetric = /revenue|sales|spend|budget|price|cost|profit|amount/i.test(activeMetric);

  // Compute aggregated data
  const aggregatedData = useMemo(() => {
    if (rawRows.length === 0 || !activeDim) return [];

    const map = {};
    rawRows.forEach(row => {
      const rawDimVal = row[activeDim];
      const dimKey = rawDimVal !== null && rawDimVal !== undefined && String(rawDimVal).trim() !== ''
        ? String(rawDimVal)
        : '(None)';

      if (!map[dimKey]) {
        map[dimKey] = {
          dimension: dimKey,
          values: [],
          count: 0
        };
      }

      const val = activeMetric ? Number(row[activeMetric]) : 1;
      if (!isNaN(val)) {
        map[dimKey].values.push(val);
      }
      map[dimKey].count += 1;
    });

    const results = Object.values(map).map(item => {
      let metricValue = 0;
      if (aggFunction === 'count') {
        metricValue = item.count;
      } else if (item.values.length > 0) {
        if (aggFunction === 'sum') {
          metricValue = item.values.reduce((a, b) => a + b, 0);
        } else if (aggFunction === 'avg') {
          metricValue = item.values.reduce((a, b) => a + b, 0) / item.values.length;
        } else if (aggFunction === 'max') {
          metricValue = Math.max(...item.values);
        } else if (aggFunction === 'min') {
          metricValue = Math.min(...item.values);
        }
      }

      return {
        name: item.dimension,
        value: Number(metricValue.toFixed(2)),
        count: item.count
      };
    });

    results.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    return results.slice(0, 15); // Show top 15 groups
  }, [rawRows, activeDim, activeMetric, aggFunction, sortOrder]);

  // Summary stats
  const totalAggVal = useMemo(() => {
    return aggregatedData.reduce((acc, r) => acc + r.value, 0);
  }, [aggregatedData]);

  const avgAggVal = useMemo(() => {
    return aggregatedData.length > 0 ? totalAggVal / aggregatedData.length : 0;
  }, [aggregatedData, totalAggVal]);

  const maxAggVal = useMemo(() => {
    return aggregatedData.length > 0 ? Math.max(...aggregatedData.map(r => r.value)) : 0;
  }, [aggregatedData]);

  if (!dataset) {
    return (
      <div className="p-6 sm:p-10 max-w-4xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(99,102,241,0.3)]">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Chart Studio</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Connect a dataset to start creating custom bar charts, line graphs, area comparisons, and donut distributions.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onUploadClick}
            className="btn-gradient px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Upload Dataset</span>
          </button>
          <button
            type="button"
            onClick={onViewDatasets}
            className="px-5 py-2.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="saas-card p-5 sm:p-6 bg-gradient-to-r from-[#0E1628] via-[#101A30] to-[#0E1628] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
              Chart Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Interactive visual analytics powered by DuckDB • Active: <span className="text-indigo-400 font-semibold">{dataset.filename}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="px-3 py-1.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === 'chart' ? <Table2 className="w-3.5 h-3.5 text-indigo-400" /> : <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{viewMode === 'chart' ? 'View Data Table' : 'View Chart'}</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar */}
      <div className="saas-card p-4 sm:p-5 border border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Chart Type Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full bg-[#111C30] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="bar">Bar Chart (Vertical)</option>
              <option value="hbar">Horizontal Bar</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="donut">Donut Chart</option>
            </select>
          </div>

          {/* Dimension (X-Axis) */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Group Dimension (X-Axis)
            </label>
            <select
              value={activeDim}
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="w-full bg-[#111C30] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {schemaKeys.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Metric (Y-Axis) */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Metric (Y-Axis)
            </label>
            <select
              value={activeMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              disabled={aggFunction === 'count'}
              className="w-full bg-[#111C30] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {numCols.length > 0 ? (
                numCols.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))
              ) : (
                <option value="">(None - Record Count)</option>
              )}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Aggregation
            </label>
            <select
              value={aggFunction}
              onChange={(e) => setAggFunction(e.target.value)}
              className="w-full bg-[#111C30] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count Records</option>
              <option value="max">Maximum</option>
              <option value="min">Minimum</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Order By
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full bg-[#111C30] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="desc">Highest First (Desc)</option>
              <option value="asc">Lowest First (Asc)</option>
            </select>
          </div>
        </div>

        {/* 3. Real-Time Metric Pills */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Total {aggFunction.toUpperCase()}:</span>
            <span className="font-mono font-bold text-white">{formatVal(totalAggVal, isCurrencyMetric)}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Average:</span>
            <span className="font-mono font-bold text-white">{formatVal(avgAggVal, isCurrencyMetric)}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Peak:</span>
            <span className="font-mono font-bold text-emerald-400">{formatVal(maxAggVal, isCurrencyMetric)}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Groups:</span>
            <span className="font-mono font-bold text-cyan-400">{aggregatedData.length}</span>
          </div>
        </div>
      </div>

      {/* 4. Canvas Area */}
      <div className="saas-card p-5 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              {aggFunction.toUpperCase()} of {aggFunction === 'count' ? 'Records' : activeMetric} by {activeDim}
            </h3>
            <p className="text-[11px] text-slate-400">
              Showing top {aggregatedData.length} categories
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAskInChat?.(`Analyze the breakdown of ${activeMetric || 'records'} grouped by ${activeDim}`)}
            className="btn-gradient px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Copilot</span>
          </button>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">{activeDim}</th>
                  <th className="py-2 px-3 text-right">{aggFunction.toUpperCase()} ({activeMetric || 'Count'})</th>
                  <th className="py-2 px-3 text-right">Records</th>
                  <th className="py-2 px-3 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {aggregatedData.map((row, idx) => {
                  const share = totalAggVal > 0 ? ((row.value / totalAggVal) * 100).toFixed(1) : '—';
                  return (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{row.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatVal(row.value, isCurrencyMetric)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.count}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono text-xs font-bold text-indigo-400">{share}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-72 sm:h-80 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'hbar' ? (
                <BarChart data={aggregatedData} layout="vertical" margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickFormatter={(val) => formatVal(val, isCurrencyMetric)} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatVal(val, isCurrencyMetric), activeMetric || 'Value']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {aggregatedData.map((_, idx) => (
                      <Cell key={`bar-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickFormatter={(val) => formatVal(val, isCurrencyMetric)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatVal(val, isCurrencyMetric), activeMetric || 'Value']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="studioAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickFormatter={(val) => formatVal(val, isCurrencyMetric)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatVal(val, isCurrencyMetric), activeMetric || 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8B5CF6" fillOpacity={1} fill="url(#studioAreaGrad)" />
                </AreaChart>
              ) : chartType === 'donut' ? (
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {aggregatedData.map((_, idx) => (
                      <Cell key={`donut-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatVal(val, isCurrencyMetric), activeMetric || 'Value']}
                  />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickFormatter={(val) => formatVal(val, isCurrencyMetric)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                    formatter={(val) => [formatVal(val, isCurrencyMetric), activeMetric || 'Value']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {aggregatedData.map((_, idx) => (
                      <Cell key={`bar-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartStudioView;
