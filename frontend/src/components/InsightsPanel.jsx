import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calculator, 
  ArrowDown, 
  Award, 
  Sparkles,
  Zap
} from 'lucide-react';
import { generateInsights } from '../utils/insightGenerator';

const IconMap = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'target': Target,
  'calculator': Calculator,
  'arrow-down': ArrowDown,
  'award': Award,
  'zap': Zap
};

const InsightsPanel = ({ data, xKey, yKey }) => {
  const insights = generateInsights(data, xKey, yKey);

  if (insights.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100 font-bold text-lg">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Sparkles size={20} />
        </div>
        Smart Insights
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const IconComponent = IconMap[insight.icon] || Zap;
          const statusColors = {
            positive: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
            negative: 'border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300',
            neutral: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
          };

          const iconColors = {
            positive: 'text-emerald-500 dark:text-emerald-400',
            negative: 'text-rose-500 dark:text-rose-400',
            neutral: 'text-indigo-500 dark:text-indigo-400'
          };

          return (
            <div 
              key={index}
              className={`p-4 rounded-xl border ${statusColors[insight.status]} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col gap-3 group`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm ${iconColors[insight.status]} shadow-sm`}>
                  <IconComponent size={18} />
                </div>
                {insight.type === 'trend' && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${insight.value >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    {insight.value >= 0 ? '+' : ''}{insight.value}%
                  </span>
                )}
              </div>
              
              <p className="text-sm font-medium leading-relaxed">
                {insight.text}
              </p>

              <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-medium opacity-60 uppercase tracking-tighter">
                  Calculated from {data.length} records
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsPanel;
