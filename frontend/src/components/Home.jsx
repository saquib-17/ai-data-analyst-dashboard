import React from 'react';
import CsvUploader from './CsvUploader';
import AIQueryBox from './AIQueryBox';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-start py-2 md:py-1 w-full space-y-3">
      
      {/* Hero Section */}
      <div className="text-center space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
          Analyze Data Intelligently
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          AI Data Analyst
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Upload your datasets and let the dashboard prepare insights. This advanced generative AI seamlessly connects your data to intelligence.
        </p>
      </div>

      {/* Main Dashboard Components */}
      <div className="w-full flex flex-col gap-8 md:gap-12 relative z-10">
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
           <CsvUploader />
        </section>
        
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <AIQueryBox />
        </section>
      </div>
      
    </div>
  );
};

export default Home;
