import React from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2, ChevronRight, FileUp } from 'lucide-react';

const UploadCard = ({
  dragActive,
  handleDrag,
  handleDrop,
  onButtonClick,
  file,
  inputRef,
  handleChange,
  clearFile,
  handleUpload,
  loading,
  error,
  success
}) => {
  return (
    <div className="relative isolate flex flex-col md:flex-row gap-6 bg-white dark:bg-[#1E2536] p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-white/5 transition-all overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-gradient-to-bl from-indigo-500/10 to-transparent dark:from-indigo-500/15 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Info Side */}
      <div className="flex-1 flex flex-col justify-center max-w-sm">
        <div className="inline-flex items-center gap-2 mb-4">
           <span className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
             <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={3} />
           </span>
           <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Step 1</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white leading-tight mb-3">Connect your dataset</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
          Drag and drop your structured CSV file to instantly unlock deep analytical insights, generate charts, and query your data naturally.
        </p>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm mb-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
        )}
      </div>

      {/* Dropzone Side */}
      <div 
        className={`flex-1 relative flex flex-col items-center justify-center min-h-[300px] rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${dragActive 
            ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.02]' 
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={file ? undefined : onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <div className="flex flex-col items-center text-center p-8 cursor-pointer pointer-events-none group-hover:scale-105 transition-transform duration-500">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-5 group-hover:shadow-md transition-all">
              <FileUp className="w-7 h-7 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
              Drop file directly here
            </p>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              or click to browse from computer
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full p-6 justify-between z-10 bg-white/40 dark:bg-[#1E2536]/40 backdrop-blur-sm">
             <div className="flex flex-col items-center justify-center flex-1">
                {/* File Visualization */}
                <div className="w-24 h-28 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden mb-6 group relative">
                   <div className="h-6 bg-slate-100 dark:bg-slate-800 flex items-center px-3 border-b border-slate-100 dark:border-slate-700">
                     <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                     </div>
                   </div>
                   <div className="flex-1 flex items-center justify-center p-2 relative">
                      <FileText className="w-10 h-10 text-indigo-300 dark:text-indigo-600/50" strokeWidth={1} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearFile(); }} 
                        className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove file"
                      >
                         <X className="w-8 h-8 text-white bg-red-500 rounded-full p-1 shadow-lg" />
                      </button>
                   </div>
                </div>

                <div className="text-center px-4 w-full">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate w-full mb-1" title={file.name}>
                    {file.name}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
             </div>
             
             <button 
               onClick={(e) => { e.stopPropagation(); handleUpload(); }}
               disabled={loading}
               className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm tracking-wide shadow-[0_10px_20px_rgb(79,70,229,0.2)] hover:shadow-[0_10px_25px_rgb(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
             >
               {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                  <>
                    Initialize Analysis <ChevronRight className="w-4 h-4" />
                  </>
               )}
             </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default UploadCard;
