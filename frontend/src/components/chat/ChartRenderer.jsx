import React, { useState } from 'react';
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
import { BarChart3, Table as TableIcon, Hash, TrendingUp, PieChart as PieIcon, ChevronDown, AlignLeft } from 'lucide-react';

const PALETTE = [
  '#8B5CF6', // Electric Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan/Teal
  '#F97316', // Orange
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#5B5CF0', // Indigo
];

const formatValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `₹${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
    return Number.isInteger(val) ? `₹${val.toLocaleString()}` : `₹${val.toFixed(2)}`;
  }
  return String(val);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[#172033] text-white text-xs py-2 px-3 rounded-xl shadow-xl border border-white/10">
        <p className="font-semibold text-slate-300 mb-0.5">{label || item.name}</p>
        <p className="font-bold text-[#8B5CF6]">
          {item.name || item.dataKey || 'Metric'}: {formatValue(item.value)}
        </p>
      </div>
    );
  }
  return null;
};

const ChartRenderer = ({ config, rawData }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  if (!config && (!rawData || rawData.length === 0)) return null;

  const data = Array.isArray(config?.data) && config.data.length > 0
    ? config.data
    : (Array.isArray(rawData) ? rawData : []);

  const initialType = config?.type || (data.length <= 6 ? 'bar' : 'line');
  const effectiveType = selectedType || initialType;

  // 1. Single-value KPI Result
  if (effectiveType === 'kpi' || (data.length === 1 && data[0]?.value !== undefined)) {
    const item = data[0] || config;
    const op = (item.operation || config?.operation || 'Total').toUpperCase();
    const metric = item.metric || config?.metric || 'Metric';
    const val = item.value !== undefined ? item.value : config?.value;
    const count = item.validCount || config?.validCount;

    return (
      <div className="w-full my-3 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-indigo-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-2">
          <Hash className="w-3.5 h-3.5" />
          <span>{op} • {metric}</span>
        </div>
        <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight my-1">
          {typeof val === 'number' ? formatValue(val) : (val ?? '—')}
        </div>
        {count !== undefined && count !== null && (
          <span className="text-xs text-slate-400 font-medium">
            Calculated across {count.toLocaleString()} records in DuckDB
          </span>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full my-3 py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
        No records returned for this operation.
      </div>
    );
  }

  const sample = data[0] || {};
  const sampleKeys = Object.keys(sample);
  const xKey = config?.xKey || sampleKeys[0];
  const yKey = config?.yKey || sampleKeys[1] || sampleKeys[0];
  const title = config?.title || `${yKey} by ${xKey}`;

  const chartData = data.map((d) => ({
    ...d,
    [yKey]: typeof d[yKey] === 'number' ? d[yKey] : (Number(String(d[yKey]).replace(/[^0-9.-]+/g, '')) || 0)
  }));

  const renderTable = () => {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 max-h-72 mt-2">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-slate-400">#</th>
              {sampleKeys.map((col) => (
                <th key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice(0, 30).map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                {sampleKeys.map((col) => (
                  <td key={col} className="px-3.5 py-2 whitespace-nowrap font-medium text-slate-700">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 30 && (
          <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
            Showing first 30 of {data.length} records
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    if (!xKey || !yKey) return renderTable();

    // 1. Horizontal Bar Chart (Matches left chart in reference image)
    if (effectiveType === 'horizontal-bar' || (effectiveType === 'bar' && data.length <= 6)) {
      return (
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={yKey} radius={[0, 6, 6, 0]} maxBarSize={28}>
                {chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 2. Line Trend Chart (Matches right chart in reference image)
    if (effectiveType === 'line') {
      return (
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#FFFFFF', stroke: '#8B5CF6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 3. Area Chart
    if (effectiveType === 'area') {
      return (
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                dy={8}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 4. Pie / Donut Chart
    if (effectiveType === 'pie') {
      return (
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                wrapperStyle={{ paddingTop: 10 }}
              />
              <Pie
                data={chartData}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="46%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {chartData.map((_, idx) => (
                  <Cell key={`pie-cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 5. Vertical Bar Chart
    return (
      <div className="h-64 sm:h-72 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              dy={8}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={45}>
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full my-3 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card transition-all">
      {/* Top Header Row with Title and Chart Type Dropdown Pill */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            {effectiveType === 'pie' ? (
              <PieIcon className="w-4 h-4" />
            ) : effectiveType === 'line' || effectiveType === 'area' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">DuckDB computed aggregation</p>
          </div>
        </div>

        {/* View / Chart Type Dropdown Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <span className="capitalize">
              {effectiveType === 'table' ? 'Table View' : `${effectiveType.replace('-', ' ')} Chart`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showTypeMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {[
                { id: 'horizontal-bar', label: 'Horizontal Bar' },
                { id: 'bar', label: 'Vertical Bar' },
                { id: 'line', label: 'Line Chart' },
                { id: 'area', label: 'Area Chart' },
                { id: 'pie', label: 'Pie Chart' },
                { id: 'table', label: 'Table View' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(t.id);
                    setShowTypeMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                    effectiveType === t.id
                      ? 'bg-purple-50 text-indigo-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render Chart or Table */}
      {effectiveType !== 'table' ? renderChart() : renderTable()}
    </div>
  );
};

export default ChartRenderer;
