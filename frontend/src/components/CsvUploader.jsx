import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import DataAnalysis from './DataAnalysis';
import UploadCard from './UploadCard';
const CsvUploader = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setSuccess(null);
    
    // Check if it's a CSV file
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file (.csv).");
      setFile(null);
      return;
    }

    // Limit to 2MB as per optional enhancement
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const resetData = () => {
    setCsvData([]);
    setHeaders([]);
    clearFile();
  }

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      setCsvData(result.data);
      if (result.data.length > 0) {
        setHeaders(Object.keys(result.data[0]));
      }
      setSuccess("File parsed successfully!");
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {!csvData || csvData.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full mb-8">
            <UploadCard 
              dragActive={dragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              onButtonClick={onButtonClick}
              file={file}
              inputRef={inputRef}
              handleChange={handleChange}
              clearFile={clearFile}
              handleUpload={handleUpload}
              loading={loading}
              error={error}
              success={success}
            />
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
             <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Dataset Active</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">{csvData.length} Rows</span>
             </div>
             
             <button 
               onClick={resetData}
               className="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-all duration-300 text-sm font-bold flex items-center gap-2"
             >
               <Trash2 size={16} /> Disconnect Data
             </button>
          </div>
          
          <DataAnalysis data={csvData} headers={headers} />
        </div>
      )}
      
    </div>
  );
};

export default CsvUploader;
