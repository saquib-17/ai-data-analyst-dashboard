import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Eye,
  Table,
  MessageSquare,
  AlertCircle,
  Loader2,
  Download,
  Filter
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const DatasetsView = ({
  datasets = [],
  activeDataset = null,
  onSelectDataset,
  onDatasetUploaded,
  onDeleteDataset,
  onNavigateTab
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (selectedFile) => {
    setError(null);
    setSuccess(null);

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid CSV file (.csv).');
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit. Please upload a smaller file.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload dataset.');
      }

      setSuccess(`Dataset "${data.filename}" successfully parsed and registered!`);
      onDatasetUploaded?.(data.datasetId);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.message || 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Dataset Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Upload, inspect, and manage your analytical CSV files stored durably for DuckDB querying.
        </p>
      </div>

      {/* Drag and Drop Upload Card */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`saas-card p-6 sm:p-8 border-2 border-dashed text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-brand-indigo bg-indigo-50/40 shadow-glow-indigo'
            : 'border-slate-300 hover:border-brand-indigo/60 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-indigo flex items-center justify-center mx-auto mb-3">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {loading ? 'Processing & Profiling Dataset...' : 'Click or drag a CSV file here'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
          Supports comma-delimited `.csv` up to 2MB. Formatted currency, dates, percentages, and headers are automatically detected.
        </p>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50">
          Browse File
        </span>

        {/* Feedback Banners */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-center gap-2 max-w-md mx-auto">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Datasets Table */}
      <div className="saas-card p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Uploaded Datasets</h2>
            <p className="text-xs text-slate-500">
              {datasets.length} dataset{datasets.length === 1 ? '' : 's'} registered in system
            </p>
          </div>
        </div>

        {datasets.length === 0 ? (
          <div className="py-12 text-center text-xs text-workspace-muted">
            No datasets currently available. Upload your first dataset above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-3">Dataset Name</th>
                  <th className="py-3 px-3">Rows</th>
                  <th className="py-3 px-3">Columns</th>
                  <th className="py-3 px-3">Uploaded</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => {
                  const isActive = activeDataset?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isActive ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-xs">{d.filename}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {d.rowCount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {d.columnCount}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDataset(d.id);
                              onNavigateTab('chat');
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-brand-indigo text-brand-indigo hover:text-white transition-colors"
                            title="Chat / Analyze dataset"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectDataset(d.id);
                              onNavigateTab('schema');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Inspect Schema"
                          >
                            <Table className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectDataset(d.id);
                              onNavigateTab('preview');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Preview data records"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteDataset(d.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetsView;

