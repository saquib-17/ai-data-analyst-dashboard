import React, { useState } from 'react';
import { 
  Sparkles, 
  LayoutGrid,
  RotateCcw
} from 'lucide-react';
import QueryPanel from './QueryPanel';
import SummaryCard from './SummaryCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

/**
 * AIQueryBox Component
 * Handles natural language querying of the dataset and visualizes results.
 */
const AIQueryBox = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [insight, setInsight] = useState('');

    const resetQuery = () => {
        setQuery('');
        setData(null);
        setInsight('');
        setError(null);
    };

    const handleAnalyze = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setData(null);
        setInsight('');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to analyze data.');
            }

            setData(result.result);
            setInsight(result.insight);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine chart type and keys
    const renderVisualization = () => {
        if (!data || data.length === 0) return null;

        // If it's a single aggregation result (sum, average, count)
        if (data.length === 1 && data[0].value !== undefined) {
             return (
                <div className="flex flex-col items-center justify-center py-12 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3">
                        {data[0].operation} of {data[0].metric || 'records'}
                    </span>
                    <span className="text-6xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {typeof data[0].value === 'number' ? data[0].value.toLocaleString() : data[0].value}
                    </span>
                </div>
             );
        }

        // Identify keys for charting
        const firstItem = data[0];
        const keys = Object.keys(firstItem);
        
        // Find the numeric key (metric) and the string key (category)
        const numericKey = keys.find(k => typeof firstItem[k] === 'number');
        const categoryKey = keys.find(k => typeof firstItem[k] === 'string' || k !== numericKey);

        if (!numericKey || !categoryKey) {
            return (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800/80">
                            <tr>
                                {keys.map(k => <th key={k} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">{k}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 5).map((row, i) => (
                                <tr key={i} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {keys.map(k => <td key={k} className="px-4 py-3">{row[k]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

        return (
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey={categoryKey} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey={numericKey} radius={[4, 4, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="w-full relative flex flex-col items-center mt-8 z-10">
            {/* Elevated Query Input */}
            <QueryPanel 
              query={query} 
              setQuery={setQuery} 
              handleAnalyze={handleAnalyze} 
              loading={loading} 
              error={error} 
            />

            {/* Results Grid below panel */}
            <div className="w-full mt-10 md:mt-16 flex flex-col gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {(insight || data) && (
                    <div className="flex flex-col gap-8 w-full">
                        <div className="flex justify-end w-full">
                             <button onClick={resetQuery} className="py-2.5 px-5 bg-white dark:bg-[#1E2536] border border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/20 flex items-center gap-2">
                                <RotateCcw size={16} className="text-slate-400 dark:text-slate-500" /> Reset View
                             </button>
                        </div>
                        {insight && (
                            <SummaryCard insight={insight} />
                        )}

                        {data && (
                            <div className="w-full bg-white dark:bg-[#1E2536] p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-white/5 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-50 dark:bg-purple-500/10 rounded-xl">
                                        <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                        Data Extracted
                                    </h4>
                                </div>
                                
                                <div className="w-full bg-slate-50/50 dark:bg-[#151A26] rounded-2xl p-4 sm:p-6 overflow-hidden border border-slate-100 dark:border-white/5">
                                    {renderVisualization()}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !data && !error && !insight && (
                    <div className="flex flex-col items-center justify-center p-12 text-center pointer-events-none opacity-50 dark:opacity-30">
                        <Sparkles className="w-12 h-12 text-indigo-400 mb-4" />
                        <p className="text-lg font-medium text-slate-500">
                            Awaiting your natural language instructions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIQueryBox;
