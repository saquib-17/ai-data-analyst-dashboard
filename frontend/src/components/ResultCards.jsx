import React from 'react';
import { Database, Search } from 'lucide-react';

const ResultCards = ({ data, headers }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-slate-50 dark:bg-[#1E2536] rounded-[2rem] p-12 flex flex-col items-center justify-center border border-slate-100 dark:border-white/5">
        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">No records found matching current criteria.</p>
      </div>
    );
  }

  const limitedData = data.slice(0, 100); // limit to a reasonable number to prevent huge DOM

  return (
    <div className="w-full bg-white dark:bg-[#1E2536] rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20 shadow-sm">
             <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Dataset Records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tabular view presentation</p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 rounded-full px-4 py-1.5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.length} Total</span>
        </div>
      </div>

      <div className="w-full max-h-[500px] overflow-auto bg-slate-50/50 dark:bg-[#151A26] rounded-2xl ring-1 ring-slate-100 dark:ring-white/5 relative">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0 whitespace-nowrap">
                #
              </th>
              {headers.map((header, idx) => (
                <th key={idx} className="py-4 px-6 text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-r border-slate-200/50 dark:border-slate-700/50 last:border-r-0 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {limitedData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="py-3 px-6 font-semibold text-slate-400 dark:text-slate-600 border-r border-slate-100/50 dark:border-slate-800/50 group-hover:text-indigo-500 transition-colors whitespace-nowrap">
                  {rowIdx + 1}
                </td>
                {headers.map((header, colIdx) => (
                  <td key={`${rowIdx}-${colIdx}`} className="py-3 px-6 text-slate-700 dark:text-slate-300 border-r border-slate-100/50 dark:border-slate-800/50 last:border-r-0 whitespace-nowrap">
                    {row[header] !== null && row[header] !== undefined && row[header] !== '' ? row[header] : <span className="text-slate-300 dark:text-slate-600">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length > 100 && (
        <div className="w-full mt-6 flex justify-center">
           <div className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
             Showing first 100 records
           </div>
        </div>
      )}
    </div>
  );
};

export default ResultCards;
