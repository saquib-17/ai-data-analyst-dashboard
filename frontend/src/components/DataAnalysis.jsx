import React, { useState, useEffect } from 'react';
import { Filter, Search, BarChart3, Layers, RotateCcw, ChevronDown, ChevronRight, Calculator, Activity } from 'lucide-react';
import { filterData, groupData, calculateMetrics } from '../utils/dataAnalysis';
import BarChartComponent from './charts/BarChartComponent';
import LineChartComponent from './charts/LineChartComponent';
import InsightsPanel from './InsightsPanel';
import ChartContainer from './ChartContainer';
import ResultCards from './ResultCards';

const DataAnalysis = ({ data, headers }) => {
  // Reset when new data is received
  useEffect(() => {
    resetAnalysis();
  }, [data]);

  // States for outputs
  const [currentData, setCurrentData] = useState(data);
  const [groupedData, setGroupedData] = useState(null);
  const [metricsResult, setMetricsResult] = useState(null);

  // States for controls
  const [filterState, setFilterState] = useState({ column: headers[0] || '', operator: '=', value: '' });
  const [groupState, setGroupState] = useState({ column: headers[0] || '' });
  const [metricState, setMetricState] = useState({ column: headers[0] || '', type: 'count' });

  // UI state
  const [expandedGroups, setExpandedGroups] = useState({});

  // Visualization state
  const [chartConfig, setChartConfig] = useState({ type: 'bar', xKey: headers[0] || '', yKey: headers[0] || '' });

  const resetAnalysis = () => {
    setCurrentData(data);
    setGroupedData(null);
    setMetricsResult(null);
    setFilterState({ column: headers[0] || '', operator: '=', value: '' });
    setGroupState({ column: headers[0] || '' });
    setMetricState({ column: headers[0] || '', type: 'count' });
    setExpandedGroups({});
    setChartConfig({ type: 'bar', xKey: headers[0] || '', yKey: headers[0] || '' });
  };

  const handleFilter = () => {
    const result = filterData(data, filterState.column, filterState.operator, filterState.value);
    setCurrentData(result);
    // When filtering, we typically want to clear grouping/metrics as they might be stale
    setGroupedData(null);
    setMetricsResult(null);
  };

  const handleGroup = () => {
    const result = groupData(currentData, groupState.column);
    setGroupedData(result);
    setMetricsResult(null); // Clear metrics when viewing groups
    // Auto-expand first few groups optionally, or none
    setExpandedGroups({});
  };

  const handleCalculateMetric = () => {
    const result = calculateMetrics(currentData, metricState.column, metricState.type);
    setMetricsResult(result);
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">
      {/* Control Sidebar */}
      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        {/* Filter Card */}
        <div className="bg-white dark:bg-[#1E2536] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-50">
             <Filter className="w-20 h-20 text-slate-50 dark:text-slate-800 -rotate-12 translate-x-4 -translate-y-4" />
           </div>
           <div className="relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                 <Filter size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Filter Data</h3>
           </div>
           
           <div className="relative z-10 flex flex-col gap-3 mt-2">
              <select value={filterState.column} onChange={e => setFilterState({ ...filterState, column: e.target.value })} className="w-full bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="" disabled>Column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={filterState.operator} onChange={e => setFilterState({ ...filterState, operator: e.target.value })} className="w-1/3 bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="=">=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&ge;</option>
                  <option value="<=">&le;</option>
                  <option value="contains">contains</option>
                </select>
                <input type="text" placeholder="Value..." value={filterState.value} onChange={e => setFilterState({ ...filterState, value: e.target.value })} className="w-2/3 bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <button onClick={handleFilter} className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md font-semibold text-sm flex items-center justify-center gap-2">
                <Search size={16} /> Apply
              </button>
           </div>
        </div>

        {/* Group & Metrics Card */}
        <div className="bg-white dark:bg-[#1E2536] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-6 relative overflow-hidden">
           <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
                    <Layers size={16} className="text-pink-600 dark:text-pink-400" />
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-slate-100">Grouping</h3>
              </div>
              <select value={groupState.column} onChange={e => setGroupState({ ...groupState, column: e.target.value })} className="w-full bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-pink-500/20">
                <option value="" disabled>Column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <button onClick={handleGroup} className="w-full py-3 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 text-pink-700 dark:text-pink-300 rounded-xl transition-all font-semibold text-sm">
                Group Data
              </button>
           </div>

           <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>

           <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Calculator size={16} className="text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-slate-100">Metrics</h3>
              </div>
              <div className="flex gap-2">
                 <select value={metricState.type} onChange={e => setMetricState({ ...metricState, type: e.target.value })} className="w-1/2 bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                   <option value="count">Count</option>
                   <option value="sum">Sum</option>
                   <option value="average">Avg</option>
                   <option value="min">Min</option>
                   <option value="max">Max</option>
                 </select>
                 <select value={metricState.column} onChange={e => setMetricState({ ...metricState, column: e.target.value })} className="w-1/2 bg-slate-50 dark:bg-[#151A26] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                   <option value="" disabled>Column...</option>
                   {headers.map(h => <option key={h} value={h}>{h}</option>)}
                 </select>
              </div>
              <button onClick={handleCalculateMetric} className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all font-semibold text-sm">
                Calculate
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
         
         {/* Top Banner (Metric or Actions) */}
         <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {metricsResult !== null ? (
               <div className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 shadow-sm text-white flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">{metricState.type} of {metricState.column}</span>
                     <span className="text-3xl font-extrabold">{metricsResult.toLocaleString ? metricsResult.toLocaleString() : metricsResult}</span>
                  </div>
                  <Calculator className="w-12 h-12 text-white/20" />
               </div>
            ) : (
               <div className="flex-1" />
            )}

            <button onClick={resetAnalysis} className="shrink-0 h-full py-4 px-6 bg-white dark:bg-[#1E2536] border border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/20">
               <RotateCcw size={16} className="inline mr-2" /> Reset View
            </button>
         </div>

         {/* Chart View */}
         <ChartContainer chartConfig={chartConfig} setChartConfig={setChartConfig} headers={headers}>
             {chartConfig.type === 'bar' && <BarChartComponent data={currentData} xKey={chartConfig.xKey} yKey={chartConfig.yKey} />}
             {chartConfig.type === 'line' && <LineChartComponent data={currentData} xKey={chartConfig.xKey} yKey={chartConfig.yKey} />}
         </ChartContainer>

         <InsightsPanel data={currentData} xKey={chartConfig.xKey} yKey={chartConfig.yKey} />

         {/* Grid Results View / Grouped View */}
         {groupedData ? (
             <div className="w-full bg-white dark:bg-[#1E2536] rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center border border-pink-100 dark:border-pink-500/20">
                      <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Separated Subsets</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grouped by "{groupState.column}"</p>
                   </div>
                </div>
                
                <div className="flex flex-col gap-4">
                   {Object.entries(groupedData).map(([key, rows]) => (
                     <div key={key} className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151A26] rounded-2xl overflow-hidden transition-all duration-300">
                       <button onClick={() => toggleGroup(key)} className="w-full flex items-center justify-between p-5 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none">
                         <div className="flex items-center gap-3">
                           {expandedGroups[key] ? <ChevronDown size={20} className="text-indigo-500" /> : <ChevronRight size={20} className="text-slate-400" />}
                           <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{key}</span>
                         </div>
                         <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
                           {rows.length} items
                         </span>
                       </button>
                       {expandedGroups[key] && (
                         <div className="p-5 border-t border-slate-100 dark:border-slate-800">
                           <ResultCards data={rows} headers={headers} />
                         </div>
                       )}
                     </div>
                   ))}
                </div>
             </div>
         ) : (
            <ResultCards data={currentData} headers={headers} />
         )}

      </div>
    </div>
  );
};

export default DataAnalysis;
