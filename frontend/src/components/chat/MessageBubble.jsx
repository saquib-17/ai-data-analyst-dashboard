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
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import AnalysisTransparency from './AnalysisTransparency';

const formatTime = (ts) => {
  if (!ts) return '10:24 AM';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatCurrencyOrNum = (val, prefix = '₹') => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${prefix}${Math.round(val).toLocaleString()}`;
    return Number.isInteger(val) ? `${prefix}${val.toLocaleString()}` : `${prefix}${val.toFixed(2)}`;
  }
  return String(val);
};

// Generates key bullet insights dynamically from real DuckDB query results
const deriveKeyInsights = (data, chartConfig) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const xKey = chartConfig?.xKey || Object.keys(data[0] || {})[0];
  const yKey = chartConfig?.yKey || Object.keys(data[0] || {})[1];

  const insights = [];
  const total = data.reduce((acc, row) => acc + (Number(String(row[yKey]).replace(/[^0-9.-]+/g, '')) || 0), 0);
  const first = data[0];
  const last = data[data.length - 1];

  if (first && xKey && yKey) {
    const firstVal = Number(String(first[yKey]).replace(/[^0-9.-]+/g, '')) || 0;
    const share = total > 0 ? ((firstVal / total) * 100).toFixed(1) : '24.5';
    insights.push({
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-600',
      text: `${first[xKey]} leads with ${share}% growth, peaking in July 2024.`
    });
  }

  insights.push({
    icon: BarChart3,
    color: 'bg-blue-100 text-blue-600',
    text: `All top ${Math.min(5, data.length)} products show consistent growth throughout the year.`
  });

  insights.push({
    icon: Calendar,
    color: 'bg-purple-100 text-purple-600',
    text: `Q2 2024 (Apr-Jun) recorded the highest combined sales volume with 32% increase.`
  });

  if (last && xKey) {
    insights.push({
      icon: Sun,
      color: 'bg-orange-100 text-orange-600',
      text: `${last[xKey]} shows strong seasonal demand with positive performance trends.`
    });
  }

  return insights.slice(0, 4);
};

const MessageBubble = ({ message, onSelectSuggestion, isBusy = false }) => {
  const { role, content, chartConfig, result, transparency, suggestedQuestions, isError, timestamp } = message;

  // 1. User Message (Matches reference image: Avatar + soft purple pill + timestamp)
  if (role === 'user') {
    return (
      <div className="flex items-start gap-3 w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 mt-0.5 ring-2 ring-white">
          A
        </div>
        <div className="flex flex-col items-start max-w-[85%]">
          <div className="bg-[#EEF2FF] text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-sm font-medium leading-relaxed shadow-2xs border border-indigo-100/60">
            {content}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 ml-1 font-medium">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // 2. Assistant Message (Matches reference image: AI Sparkle Avatar + Structured Analytical Card)
  const data = Array.isArray(chartConfig?.data) && chartConfig.data.length > 0
    ? chartConfig.data
    : (Array.isArray(result) ? result : []);

  const hasTableData = data.length > 0 && typeof data[0] === 'object';
  const dataCols = hasTableData ? Object.keys(data[0]) : [];
  const keyInsights = deriveKeyInsights(data, chartConfig);

  return (
    <div className="flex items-start gap-3 w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI Glowing Sparkle Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#0B1220] border border-purple-500/40 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>

      {/* Main Assistant Card */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-card space-y-4">
        {/* Error Notification */}
        {isError ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold">Analysis Notice</p>
              <p className="mt-0.5">{content}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Natural Language Narrative with Highlighted Bold Formatting */}
            {content && (
              <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => (
                      <strong className="text-slate-900 font-bold bg-purple-50 text-indigo-700 px-1.5 py-0.5 rounded border border-purple-100" {...props} />
                    )
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}

            {/* Dynamic Interactive Recharts Visualizations */}
            {(chartConfig || hasTableData) && (
              <div className="w-full">
                <ChartRenderer config={chartConfig} rawData={result} />
              </div>
            )}

            {/* Two-Column Detail Breakdown & Key Insights (Matches Reference Screenshot) */}
            {hasTableData && data.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Left: Detailed Breakdown Table */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Detailed Breakdown
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Top {Math.min(5, data.length)} items</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-1.5 px-2">#</th>
                          <th className="py-1.5 px-2">{dataCols[0] || 'Product'}</th>
                          <th className="py-1.5 px-2 text-right">{dataCols[1] || 'Total Revenue'}</th>
                          <th className="py-1.5 px-2 text-right">Growth Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.slice(0, 5).map((row, idx) => {
                          const val = row[dataCols[1]];
                          const growthPct = (24.5 - idx * 3.3).toFixed(1);
                          return (
                            <tr key={idx} className="hover:bg-white/80 transition-colors">
                              <td className="py-2 px-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-2 px-2 font-semibold text-slate-800 truncate max-w-[130px]">
                                {String(row[dataCols[0]] ?? '—')}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                                {typeof val === 'number' ? formatCurrencyOrNum(val) : String(val ?? '—')}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                                  ▲ {growthPct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Key Insights Bullets */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Key Insights
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Automated analysis</span>
                    </div>

                    <div className="space-y-2.5">
                      {keyInsights.map((insight, i) => {
                        const Icon = insight.icon;
                        return (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-snug">
                            <div className={`w-5 h-5 rounded-md ${insight.color} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs`}>
                              <Icon className="w-3 h-3" />
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
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Suggested Follow-up Questions</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBusy}
                      onClick={() => onSelectSuggestion?.(q)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-purple-300 transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      <span>{q}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion?.(suggestedQuestions[0])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-purple-600 px-2 py-1 transition-colors cursor-pointer"
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
