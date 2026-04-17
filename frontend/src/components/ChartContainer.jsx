import React from 'react';
import { AreaChart, LayoutTemplate } from 'lucide-react';

const ChartContainer = ({ chartConfig, setChartConfig, headers, children }) => {
  return (
    <div className="bg-white dark:bg-[#1E2536] rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-white/5 w-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
             <AreaChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Data Visualization</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Render data across chosen axes</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
           <div className="flex items-center pl-2 text-slate-400 dark:text-slate-500">
             <LayoutTemplate className="w-4 h-4 mr-2" />
             <span className="text-xs font-semibold uppercase tracking-wider">Params</span>
           </div>
           <select 
             value={chartConfig.type} 
             onChange={e => setChartConfig({ ...chartConfig, type: e.target.value })}
             className="bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2"
           >
             <option value="bar">Bar Chart</option>
             <option value="line">Line Chart</option>
           </select>

           <select 
             value={chartConfig.xKey} 
             onChange={e => setChartConfig({ ...chartConfig, xKey: e.target.value })}
             className="bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2"
           >
             <option value="" disabled>Select X Axis</option>
             {headers.map(h => <option key={`x-${h}`} value={h}>{h}</option>)}
           </select>

           <select 
             value={chartConfig.yKey} 
             onChange={e => setChartConfig({ ...chartConfig, yKey: e.target.value })}
             className="bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2"
           >
             <option value="" disabled>Select Y Axis</option>
             {headers.map(h => <option key={`y-${h}`} value={h}>{h}</option>)}
           </select>
        </div>
      </div>

      <div className="w-full bg-slate-50/50 dark:bg-[#151A26] rounded-2xl p-6 min-h-[400px] flex justify-center items-center relative overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
        <div className="w-full h-[350px] relative">
            {children}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;
