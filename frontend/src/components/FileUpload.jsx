import React from 'react';

const FileUpload = () => {
  return (
    <div className="glass-panel p-8 md:p-12 w-full r">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        
        <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center border border-white/10 shadow-inner">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-medium text-white">Upload your dataset</h3>
          <p className="text-gray-400 text-sm">Drag and drop your CSV or Excel file right here</p>
        </div>

        <div className="w-full max-w-md p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 transition-colors bg-dark/30 hover:bg-dark/50 cursor-pointer group">
          <div className="flex flex-col items-center space-y-3">
            <button className="btn-primary">
              Browse Files
            </button>
            <p className="text-xs text-gray-500 mt-2">Supported formats: .csv, .xlsx (Max 50MB)</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FileUpload;
