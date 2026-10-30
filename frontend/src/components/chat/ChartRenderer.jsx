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
import { BarChart3, Table as TableIcon, Hash, TrendingUp, PieChart as PieIcon, ChevronDown } from 'lucide-react';

const PALETTE = [
  '#8B5CF6', // Electric Purple (MacBook Pro)
  '#3B82F6', // Blue (iPhone 15)
  '#06B6D4', // Cyan/Teal (Nike Shoes)
  '#F97316', // Orange (Coffee Maker)
  '#EC4899', // Pink (Office Chair)
  '#10B981', // Emerald
  '#6366F1', // Indigo
];

const formatValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `$${Math.round(val / 1_000)}K`;
    return Number.isInteger(val) ? `$${val.toLocaleString()}` : `$${val.toFixed(2)}`;
  }
  return String(val);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B1220] text-white text-xs py-2.5 px-3.5 rounded-xl shadow-2xl border border-white/10 max-w-xs z-50">
        <p className="font-semibold text-slate-300 mb-1 border-b border-white/10 pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: item.color || item.fill }} />
                <span>{item.name || item.dataKey}</span>
              </span>
              <span className="font-bold text-white font-mono">
                {formatValue(item.value)}
              </span>
            </div>
          ))}
        </div>
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

  const initialType = config?.type || (data.length <= 6 ? 'horizontal-bar' : 'line');
  const effectiveType = selectedType || initialType;

  // 1. Single-value KPI Result
  if (effectiveType === 'kpi' || (data.length === 1 && data[0]?.value !== undefined)) {
    const item = data[0] || config;
    const op = (item.operation || config?.operation || 'Total').toUpperCase();
    const metric = item.metric || config?.metric || 'Metric';
    const val = item.value !== undefined ? item.value : config?.value;
    const count = item.validCount || config?.validCount;

    return (
      <div className="w-full my-3 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-[#0E1628] to-purple-500/10 border border-white/10 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide uppercase mb-2">
          <Hash className="w-3.5 h-3.5" />
          <span>{op} • {metric}</span>
        </div>
        <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight my-1 font-mono">
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
      <div className="w-full my-3 py-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
        No records returned for this operation.
      </div>
    );
  }

  const sample = data[0] || {};
  const sampleKeys = Object.keys(sample);
  const xKey = config?.xKey || sampleKeys[0];
  const yKey = config?.yKey || sampleKeys[1] || sampleKeys[0];
  const title = config?.title || `${yKey} by ${xKey}`;
  const subtitle = config?.subtitle || 'Total revenue for each product';

  const chartData = data.map((d) => ({
    ...d,
    [yKey]: typeof d[yKey] === 'number' ? d[yKey] : (Number(String(d[yKey]).replace(/[^0-9.-]+/g, '')) || 0)
  }));

  const renderTable = () => {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0B1220] max-h-72 mt-2">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-[#111C30] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/[0.08]">
            <tr>
              <th className="px-3 py-2 text-slate-500 font-mono">#</th>
              {sampleKeys.map((col) => (
                <th key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {data.slice(0, 30).map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                {sampleKeys.map((col) => (
                  <td key={col} className="px-3.5 py-2 whitespace-nowrap font-medium text-slate-300">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 30 && (
          <div className="p-2 text-center text-[11px] text-slate-500 bg-[#0B1220] border-t border-white/[0.06]">
            Showing first 30 of {data.length} records
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    if (!xKey || !yKey) return renderTable();

    // 1. Horizontal Bar Chart (Matches left chart in Reference Image)
    if (effectiveType === 'horizontal-bar' || (effectiveType === 'bar' && data.length <= 6 && !config?.lines)) {
      return (
        <div className="h-60 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 36, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                type="number"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: '#E2E8F0', fontSize: 10, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={yKey}
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                label={{
                  position: 'right',
                  fill: '#F1F5F9',
                  fontSize: 11,
                  fontWeight: 700,
                  formatter: formatValue
                }}
              >
                {chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 2. Line Trend Chart / Multi-line (Matches right chart in Reference Image)
    if (effectiveType === 'line' || effectiveType === 'multi-line') {
      const lines = config?.lines || (
        effectiveType === 'multi-line' && data.length > 0
          ? Object.keys(data[0]).filter(k => k !== xKey)
          : null
      );

      return (
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                dy={6}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              {lines && lines.length > 0 ? (
                <>
                  <Legend
                    wrapperStyle={{ paddingTop: 8, fontSize: '11px' }}
                    formatter={(val) => <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300">{val}</span>}
                  />
                  {lines.map((seriesKey, idx) => (
                    <Line
                      key={seriesKey}
                      type="monotone"
                      dataKey={seriesKey}
                      name={seriesKey}
                      stroke={PALETTE[idx % PALETTE.length]}
                      strokeWidth={2.4}
                      dot={{ r: 3.5, fill: '#06080F', stroke: PALETTE[idx % PALETTE.length], strokeWidth: 2 }}
                      activeDot={{ r: 5.5, fill: PALETTE[idx % PALETTE.length] }}
                    />
                  ))}
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#06080F', stroke: '#8B5CF6', strokeWidth: 2 }}
                  activeDot={{ r: 5.5, fill: '#8B5CF6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 3. Area Chart
    if (effectiveType === 'area') {
      return (
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="areaGradDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey={xKey}
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                dy={6}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 10 }}
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
                fill="url(#areaGradDark)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 4. Pie / Donut Chart
    if (effectiveType === 'pie') {
      return (
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
                wrapperStyle={{ paddingTop: 6 }}
              />
              <Pie
                data={chartData}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={75}
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
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              dy={6}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={38}>
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const getChartIcon = () => {
    if (effectiveType === 'pie') return <PieIcon className="w-3.5 h-3.5 text-purple-400" />;
    if (effectiveType === 'line' || effectiveType === 'multi-line' || effectiveType === 'area') {
      return <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />;
    }
    return <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const getChartLabel = () => {
    if (effectiveType === 'horizontal-bar') return 'Bar Chart';
    if (effectiveType === 'bar') return 'Bar Chart';
    if (effectiveType === 'line' || effectiveType === 'multi-line') return 'Line Chart';
    if (effectiveType === 'area') return 'Area Chart';
    if (effectiveType === 'pie') return 'Pie Chart';
    return 'Table View';
  };

  return (
    <div className="w-full my-2 p-4 sm:p-5 bg-[#0B1220] rounded-2xl border border-white/[0.08] shadow-lg transition-all">
      {/* Header Row with Title, Subtitle, and Chart Type Dropdown Pill */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] flex-wrap gap-2">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
            {title}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* View / Chart Type Dropdown Pill (Matches mockup '📊 Bar Chart ▾') */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            {getChartIcon()}
            <span>{getChartLabel()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showTypeMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-[#0E1628] rounded-xl shadow-2xl border border-white/10 p-1 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {[
                { id: 'horizontal-bar', label: 'Bar Chart' },
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
                      ? 'bg-purple-500/20 text-purple-300 font-bold'
                      : 'text-slate-300 hover:bg-white/[0.05]'
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
