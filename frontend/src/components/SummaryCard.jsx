import React from 'react';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SummaryCard = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2rem] p-8 md:p-10 shadow-xl w-full">
      
      {/* Decorative inner glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl mix-blend-overlay"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
           <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 text-white">
           <h3 className="text-xl font-bold mb-4 tracking-tight text-white/90">AI Synthesis</h3>
           <div className="prose prose-invert prose-indigo max-w-none text-white/80 leading-relaxed font-medium text-[15px] sm:text-base">
             <ReactMarkdown>{insight}</ReactMarkdown>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
