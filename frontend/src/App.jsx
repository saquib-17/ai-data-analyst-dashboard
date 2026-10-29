import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import DatasetContextBar from './components/layout/DatasetContextBar';
import DatasetOverviewPanel from './components/panels/DatasetOverviewPanel';
import ConversationView from './components/chat/ConversationView';
import DashboardOverview from './components/views/DashboardOverview';
import DatasetsView from './components/views/DatasetsView';
import SchemaView from './components/views/SchemaView';
import PreviewView from './components/views/PreviewView';
import InsightsView from './components/views/InsightsView';
import ConversationsView from './components/views/ConversationsView';
import ReportsView from './components/views/ReportsView';
import { getApiUrl } from './utils/api';
import { Sparkles, Crown, Check, X, Database, Cpu, ShieldCheck } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [activeTab, setActiveTab] = useState('chat');
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(null);

  // 1. Initial Data Fetching from SQLite Persistence
  useEffect(() => {
    fetchDatasets();
    fetchConversations();
  }, []);

  // 2. Fetch full schema when activeDatasetId changes
  useEffect(() => {
    if (activeDatasetId) {
      fetchDatasetSchema(activeDatasetId);
    } else {
      setActiveDataset(null);
    }
  }, [activeDatasetId]);

  // 3. Global Keyboard Shortcut: ⌘N / Ctrl+N for New Conversation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch(getApiUrl('/api/datasets'));
      if (res.ok) {
        const data = await res.json();
        const list = data.datasets || [];
        setDatasets(list);

        // Auto-select preferred 2024 dataset if present, or first dataset
        if (list.length > 0 && !activeDatasetId) {
          const pref = list.find((d) => d.filename && d.filename.includes('2024')) || list[0];
          setActiveDatasetId(pref.id);
        }
      }
    } catch (e) {
      console.warn('Failed to load datasets:', e);
    }
  };

  const fetchDatasetSchema = async (id) => {
    try {
      const res = await fetch(getApiUrl(`/api/dataset/${id}/schema`));
      if (res.ok) {
        const data = await res.json();
        setActiveDataset(data);
      }
    } catch (e) {
      console.warn('Failed to load dataset schema:', e);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(getApiUrl('/api/conversations'));
      if (res.ok) {
        const data = await res.json();
        const list = data.conversations || [];
        setConversations(list);

        // Auto-select initial active thread if none chosen
        if (list.length > 0 && !activeConversationId) {
          const pref = list.find((c) => c.title && c.title.includes('2024')) || list[0];
          if (pref) setActiveConversationId(pref.id);
        }
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  // Switch to chat and start a fresh thread
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setCurrentView('chat');
    setActiveTab('chat');
  };

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    setCurrentView('chat');
    setActiveTab('chat');
  };

  const handleSelectDataset = (id) => {
    setActiveDatasetId(id);
    setCurrentView('chat');
    setActiveTab('chat');
  };

  const handleDatasetUploaded = (uploadedData) => {
    if (uploadedData && uploadedData.datasetId) {
      fetchDatasets();
      setActiveDatasetId(uploadedData.datasetId);
      setCurrentView('chat');
      setActiveTab('chat');
    }
  };

  const handleDeleteDataset = async (datasetIdToDelete) => {
    try {
      const res = await fetch(getApiUrl(`/api/datasets/${datasetIdToDelete}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        setDatasets((prev) => prev.filter((d) => d.id !== datasetIdToDelete));
        if (activeDatasetId === datasetIdToDelete) {
          const remaining = datasets.filter((d) => d.id !== datasetIdToDelete);
          setActiveDatasetId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (e) {
      console.error('Failed to delete dataset:', e);
    }
  };

  const handleDeleteConversation = async (convIdToDelete) => {
    try {
      const res = await fetch(getApiUrl(`/api/conversations/${convIdToDelete}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convIdToDelete));
        if (activeConversationId === convIdToDelete) {
          setActiveConversationId(null);
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleRenameConversation = async (convId, newTitle) => {
    try {
      const res = await fetch(getApiUrl(`/api/conversations/${convId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
      }
    } catch (e) {
      console.error('Failed to rename conversation:', e);
    }
  };

  const handleExportCsv = () => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) return;
    const cols = Object.keys(activeDataset.data[0]);
    const csvRows = [
      cols.join(','),
      ...activeDataset.data.map((row) =>
        cols.map((c) => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeDataset.filename || 'dataset_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGlobalSearch = (query) => {
    setCurrentView('chat');
    setActiveTab('chat');
    setSearchTrigger(query);
  };

  // Content switcher for the main workspace area
  const renderMainContent = () => {
    // 1. Top-level standalone routes from Sidebar
    if (currentView === 'dashboard') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <DashboardOverview
            datasets={datasets}
            conversations={conversations}
            activeDataset={activeDataset}
            onUploadClick={() => setCurrentView('datasets')}
            onStartConversation={handleNewConversation}
            onSelectDataset={handleSelectDataset}
            onSelectConversation={handleSelectConversation}
            onViewAllDatasets={() => setCurrentView('datasets')}
            onViewAllConversations={() => setCurrentView('conversations')}
          />
        </div>
      );
    }

    if (currentView === 'datasets') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <DatasetsView
            datasets={datasets}
            activeDataset={activeDataset}
            onSelectDataset={handleSelectDataset}
            onDatasetUploaded={handleDatasetUploaded}
            onDeleteDataset={handleDeleteDataset}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              setCurrentView('chat');
            }}
          />
        </div>
      );
    }

    if (currentView === 'conversations') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <ConversationsView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
          />
        </div>
      );
    }

    if (currentView === 'reports') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <ReportsView dataset={activeDataset} onExportCsv={handleExportCsv} />
        </div>
      );
    }

    if (currentView === 'analytics-hub') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="saas-card p-6 bg-gradient-to-r from-white via-indigo-50/20 to-purple-50/20">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics Hub</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Deterministic DuckDB columnar execution metrics and SQLite persistence health.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="saas-card p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">DuckDB Columnar Engine</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Status: Active &amp; Isolated</p>
              <p className="text-[11px] text-slate-500 mt-2">
                100% deterministic arithmetic. Sums, averages, rankings, and filters computed directly in DuckDB.
              </p>
            </div>

            <div className="saas-card p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">SQLite Persistence</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {datasets.length} Datasets • {conversations.length} Threads
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                ACID transactional metadata, cascading deletes, and WAL durability enabled.
              </p>
            </div>

            <div className="saas-card p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Dataset Isolation</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">UUID Enforced</p>
              <p className="text-[11px] text-slate-500 mt-2">
                Zero cross-dataset leakage. All table names scoped to unique dataset IDs.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 2. Active Tab Views inside Dataset Context (Overview, Schema, Preview, Insights, Chat)
    if (activeTab === 'overview') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <DashboardOverview
            datasets={datasets}
            conversations={conversations}
            activeDataset={activeDataset}
            onUploadClick={() => setCurrentView('datasets')}
            onStartConversation={handleNewConversation}
            onSelectDataset={handleSelectDataset}
            onSelectConversation={handleSelectConversation}
            onViewAllDatasets={() => setCurrentView('datasets')}
            onViewAllConversations={() => setCurrentView('conversations')}
          />
        </div>
      );
    }

    if (activeTab === 'schema') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <SchemaView
            dataset={activeDataset}
            onBackToChat={() => setActiveTab('chat')}
            onAskAboutColumn={(col) => {
              setActiveTab('chat');
              setSearchTrigger(`Analyze column ${col} in detail`);
            }}
          />
        </div>
      );
    }

    if (activeTab === 'preview') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <PreviewView
            dataset={activeDataset}
            onBackToChat={() => setActiveTab('chat')}
            onExportCsv={handleExportCsv}
          />
        </div>
      );
    }

    if (activeTab === 'insights') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <InsightsView
            dataset={activeDataset}
            onAskQuestion={(q) => {
              setActiveTab('chat');
              setSearchTrigger(q);
            }}
          />
        </div>
      );
    }

    // 3. Default: 'chat' — Renders 3-Panel SaaS Workspace (Sidebar + Center Chat + Right Dataset Panel)
    return (
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        {/* Center Conversational Analysis Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ConversationView
            datasetId={activeDatasetId}
            activeDataset={activeDataset}
            activeConversationId={activeConversationId}
            searchTrigger={searchTrigger}
            onClearSearchTrigger={() => setSearchTrigger(null)}
            onConversationChange={(newId) => {
              setActiveConversationId(newId);
              fetchConversations();
            }}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Right Dataset Context Panel (Matches Reference Image) */}
        <div className="hidden xl:block w-80 p-4 border-l border-slate-200/90 overflow-y-auto bg-[#F5F7FC] flex-shrink-0">
          <DatasetOverviewPanel
            dataset={activeDataset}
            datasets={datasets}
            onSelectDataset={handleSelectDataset}
            onUploadClick={() => setCurrentView('datasets')}
            onViewSchema={() => setActiveTab('schema')}
            onViewInsights={() => setActiveTab('insights')}
            onManageConversations={() => setCurrentView('conversations')}
            onExportCsv={handleExportCsv}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FC] font-sans antialiased text-slate-800 overflow-x-hidden">
      {/* 1. Left Dark Navy Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === 'dashboard') setActiveTab('overview');
          if (view === 'insights') setActiveTab('insights');
        }}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenUpgrade={() => setProModalOpen(true)}
      />

      {/* 2. Workspace Body (Pushed by 240px Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 transition-all bg-[#F5F7FC]">
        {/* Top Header Search Bar & User Nav */}
        <TopNav
          onGlobalSearch={handleGlobalSearch}
          onOpenMobileMenu={() => setMobileOpen(true)}
          activeDataset={activeDataset}
          onOpenUpgrade={() => setProModalOpen(true)}
        />

        {/* Active Dataset Context Bar with Tabs (displayed in chat or active dataset exploration) */}
        {currentView === 'chat' ? (
          <DatasetContextBar
            dataset={activeDataset}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onUploadClick={() => setCurrentView('datasets')}
            onDeleteDataset={handleDeleteDataset}
            onExportCsv={handleExportCsv}
          />
        ) : null}

        {/* Central Workspace Content */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#F5F7FC]">
          {renderMainContent()}
        </main>
      </div>

      {/* Upgrade to Pro Modal */}
      {proModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setProModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(91,92,240,0.35)]">
              <Crown className="w-6 h-6 text-amber-300" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              DataMind AI Pro
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              Unlock enterprise-grade computational horsepower and deep collaborative analytics.
            </p>

            <div className="my-5 space-y-2.5">
              {[
                'Unlimited CSV & Parquet uploads up to 1GB',
                'Dedicated DuckDB Cloud cluster with instant queries',
                'Custom SQL workbench with export to BigQuery/Snowflake',
                'Multi-user collaborative workspace & shared threads',
                'Automated daily/weekly executive email digests'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setProModalOpen(false)}
                className="btn-gradient w-full py-2.5 text-xs text-center cursor-pointer shadow-md"
              >
                Join Priority Waitlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
