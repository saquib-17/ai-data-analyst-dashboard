import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Sun,
  AlertCircle,
  Table as TableIcon,
  ArrowUpRight
} from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import AnalysisTransparency from './AnalysisTransparency';

const formatTime = (ts) => {
  if (!ts) return '10:24 AM';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatCurrencyOrNum = (val, prefix = '$') => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${prefix}${Math.round(val).toLocaleString()}`;
    return Number.isInteger(val) ? `${prefix}${val.toLocaleString()}` : `${prefix}${val.toFixed(2)}`;
  }
  return String(val);
};

const getProductIcon = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('macbook') || n.includes('laptop') || n.includes('dell')) return '💻';
  if (n.includes('iphone') || n.includes('phone') || n.includes('smart watch')) return '📱';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('nike')) return '👟';
  if (n.includes('coffee') || n.includes('blender') || n.includes('maker')) return '☕';
  if (n.includes('chair') || n.includes('desk') || n.includes('furniture')) return '🪑';
  return '📦';
};

// Generates key bullet insights dynamically from real DuckDB query results
const deriveKeyInsights = (data, chartConfig) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const xKey = chartConfig?.xKey || Object.keys(data[0] || {})[0];
  const yKey = chartConfig?.yKey || Object.keys(data[0] || {}).find(k => k !== xKey && typeof data[0][k] === 'number') || Object.keys(data[0] || {})[1];

  const insights = [];
  const numValues = data.map(r => Number(String(r[yKey]).replace(/[^0-9.-]+/g, ''))).filter(n => !isNaN(n));
  const total = numValues.reduce((acc, v) => acc + v, 0);
  const avg = numValues.length > 0 ? total / numValues.length : 0;
  const isCur = yKey && /revenue|sales|spend|budget|price|cost|profit/i.test(yKey);

  const first = data[0];
  const last = data[data.length - 1];

  if (first && xKey && yKey) {
    const firstVal = Number(String(first[yKey]).replace(/[^0-9.-]+/g, '')) || 0;
    const share = total > 0 ? ((firstVal / total) * 100).toFixed(1) : null;
    insights.push({
      icon: TrendingUp,
      color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      text: `${first[xKey]} is highest with ${formatCurrencyOrNum(firstVal, isCur)}${share ? ` (${share}% of total)` : ''}.`
    });
  }

  if (numValues.length > 1) {
    insights.push({
      icon: BarChart3,
      color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      text: `Average ${yKey || 'value'} across top ${Math.min(5, data.length)} items is ${formatCurrencyOrNum(avg, isCur)}.`
    });
  }

  if (total > 0) {
    insights.push({
      icon: Calendar,
      color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      text: `Combined ${yKey || 'total'} for these items equals ${formatCurrencyOrNum(total, isCur)}.`
    });
  }

  if (last && xKey && last[xKey] !== first?.[xKey]) {
    const lastVal = Number(String(last[yKey]).replace(/[^0-9.-]+/g, '')) || 0;
    insights.push({
      icon: Sun,
      color: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
      text: `${last[xKey]} rounds out the set at ${formatCurrencyOrNum(lastVal, isCur)}.`
    });
  }

  return insights.slice(0, 4);
};

const MessageBubble = ({ message, onSelectSuggestion, isBusy = false }) => {
  const { role, content, chartConfig, result, transparency, suggestedQuestions, isError, timestamp } = message;

  // 1. User Message (Cinematic Dark Pill + Avatar)
  if (role === 'user') {
    return (
      <div className="flex items-start gap-3 w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0 mt-0.5 ring-2 ring-white/10">
          A
        </div>
        <div className="flex flex-col items-start max-w-[85%] min-w-0">
          <div className="bg-[#111C30] text-[#F1F5F9] rounded-2xl rounded-tl-xs px-3.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium leading-relaxed shadow-lg border border-white/[0.08] break-words">
            {content}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 ml-1 font-medium">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // 2. Assistant Message (Cinematic Dark AI Card + Glowing Sparkle Avatar)
  const data = Array.isArray(chartConfig?.data) && chartConfig.data.length > 0
    ? chartConfig.data
    : (Array.isArray(result) ? result : []);

  const hasTableData = data.length > 0 && typeof data[0] === 'object';
  const keyInsights = deriveKeyInsights(data, chartConfig);
  const trendConfig = chartConfig?.trendConfig || message?.trendConfig || null;

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI Glowing Sparkle Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A0F1D] border border-purple-500/40 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(139,92,246,0.35)]">
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse" />
      </div>

      {/* Main Assistant Card */}
      <div className="flex-1 min-w-0 overflow-hidden saas-card p-3.5 sm:p-5 lg:p-6 space-y-4">
        {/* Error Notification */}
        {isError ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold text-red-200">Analysis Notice</p>
              <p className="mt-0.5">{content}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Natural Language Narrative with Highlighted Bold Formatting */}
            {content && (
              <div className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => (
                      <strong className="text-white font-bold bg-indigo-500/15 text-indigo-300 px-1 py-0.5 rounded border border-indigo-500/25" {...props} />
                    )
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}

            {/* Dynamic Interactive Recharts Visualizations */}
            {trendConfig ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartRenderer config={chartConfig} />
                <ChartRenderer config={trendConfig} />
              </div>
            ) : (chartConfig || hasTableData) ? (
              <div className="w-full">
                <ChartRenderer config={chartConfig} rawData={result} />
              </div>
            ) : null}

            {/* Two-Column Detail Breakdown & Key Insights */}
            {hasTableData && data.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Left: Detailed Breakdown Table */}
                <div className="p-3 sm:p-4 rounded-xl border border-white/[0.08] bg-[#0B1220]/80 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Detailed Breakdown
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Top {Math.min(5, data.length)} items</span>
                    </div>

                    <div className="overflow-x-auto">
                      {(() => {
                        const tableKeys = data && data.length > 0 ? Object.keys(data[0]).slice(0, 5) : [];
                        return (
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-white/[0.08] text-[10px] uppercase font-bold text-slate-400">
                                <th className="py-1.5 px-2">#</th>
                                {tableKeys.map((key, i) => (
                                  <th key={key} className={`py-1.5 px-2 ${i === 0 ? 'text-left' : 'text-right'}`}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {data.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                                  <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                                  {tableKeys.map((key, i) => {
                                    const val = row[key];
                                    const isNum = typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null && !isNaN(parseFloat(val)));
                                    const isCur = isNum && /revenue|sales|spend|price|budget|cost|profit|aov/i.test(key);

                                    if (i === 0) {
                                      return (
                                        <td key={key} className="py-2 px-2">
                                          <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-[#111C30] border border-white/[0.08] flex items-center justify-center text-xs flex-shrink-0">
                                              {getProductIcon(val)}
                                            </span>
                                            <span className="font-semibold text-slate-200 truncate max-w-[130px]" title={String(val)}>
                                              {String(val)}
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td key={key} className="py-2 px-2 text-right font-mono font-bold text-white">
                                        {isNum ? formatCurrencyOrNum(val, isCur) : String(val ?? '—')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right: Key Insights Bullets */}
                <div className="p-3 sm:p-4 rounded-xl border border-white/[0.08] bg-[#0B1220]/80 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Key Insights
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Automated DuckDB analysis</span>
                    </div>

                    <div className="space-y-2.5">
                      {keyInsights.map((insight, i) => {
                        const Icon = insight.icon;
                        return (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug p-2.5 rounded-xl bg-[#111C30]/70 border border-white/[0.05]">
                            <div className={`w-6 h-6 rounded-lg ${insight.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="flex-1 font-medium">{insight.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Follow-up Questions Section */}
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Suggested Follow-up Questions</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBusy}
                      onClick={() => onSelectSuggestion?.(q)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#111C30] hover:bg-[#16233D] text-slate-200 hover:text-white border border-white/[0.08] hover:border-indigo-400/40 transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      <span>{q}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion?.(suggestedQuestions[0])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-cyan-400 px-2 py-1 transition-colors cursor-pointer"
                  >
                    <span>View more</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible DuckDB SQL Transparency */}
            {transparency && (
              <AnalysisTransparency transparency={transparency} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
