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
import ChartStudioView from './components/views/ChartStudioView';
import { getApiUrl } from './utils/api';
import { Sparkles, Crown, Check, X, Database, Cpu, ShieldCheck } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(null);
  const [explorerTab, setExplorerTab] = useState('schema');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // 1. Initial Data Fetching from SQLite Persistence & System Health
  useEffect(() => {
    fetchDatasets();
    fetchConversations();
    fetchSystemStatus();
  }, []);

  // 2. Fetch full schema when activeDatasetId changes
  useEffect(() => {
    if (activeDatasetId) {
      fetchDatasetSchema(activeDatasetId);
    } else {
      setActiveDataset(null);
    }
  }, [activeDatasetId]);

  // 3. Global Keyboard Shortcut: ⌘N / Ctrl+N for New Conversation, Esc for Modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewConversation();
      } else if (e.key === 'Escape') {
        if (proModalOpen) setProModalOpen(false);
        if (settingsModalOpen) setSettingsModalOpen(false);
        if (helpModalOpen) setHelpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [proModalOpen, settingsModalOpen, helpModalOpen]);

  const fetchDatasets = async () => {
    try {
      const res = await fetch(getApiUrl('/api/datasets'));
      if (res.ok) {
        const data = await res.json();
        const list = data.datasets || [];
        setDatasets(list);
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

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(getApiUrl('/api/system/status'));
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.warn('Failed to load system status:', e);
    }
  };

  const fetchConversations = async (targetIdToSelect = null) => {
    try {
      const res = await fetch(getApiUrl('/api/conversations'));
      if (res.ok) {
        const data = await res.json();
        const list = data.conversations || [];
        setConversations(list);

        // Auto-select initial active thread if none chosen, or preserve target
        const idToSelect = targetIdToSelect || activeConversationId || (list.length > 0 ? (list.find(c => c.title && c.title.includes('2024'))?.id || list[0].id) : null);
        
        if (idToSelect) {
          const selected = list.find((c) => c.id === idToSelect);
          setActiveConversationId(idToSelect);
          if (selected) {
            if (selected.datasetId) {
              setActiveDatasetId(selected.datasetId);
            } else {
              setActiveDatasetId(null);
              setActiveDataset(null);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  // Switch to chat and start a genuinely fresh thread (datasetId: null, no old dataset context)
  const handleNewConversation = async () => {
    if (isCreatingConversation) return; // Prevent double creation
    setIsCreatingConversation(true);
    try {
      const res = await fetch(getApiUrl('/api/conversations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          datasetId: null // Crucial: A new conversation starts unattached
        })
      });

      if (res.ok) {
        const newConv = await res.json();
        // Immediately reset all dataset state
        setActiveDatasetId(null);
        setActiveDataset(null);
        setActiveConversationId(newConv.id);
        setCurrentView('chat');
        setActiveTab('chat');
        await fetchConversations(newConv.id);
      } else {
        setActiveDatasetId(null);
        setActiveDataset(null);
        setActiveConversationId(null);
        setCurrentView('chat');
        setActiveTab('chat');
      }
    } catch (e) {
      console.warn('Failed to create new conversation:', e);
      setActiveDatasetId(null);
      setActiveDataset(null);
      setActiveConversationId(null);
      setCurrentView('chat');
      setActiveTab('chat');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    setCurrentView('chat');
    setActiveTab('chat');

    const target = conversations.find((c) => c.id === convId);
    if (target) {
      if (target.datasetId) {
        setActiveDatasetId(target.datasetId);
      } else {
        setActiveDatasetId(null);
        setActiveDataset(null);
      }
    }
  };

  const handleAttachDatasetToConversation = async (datasetId) => {
    if (!datasetId) return;
    setActiveDatasetId(datasetId);
    fetchDatasetSchema(datasetId);

    if (activeConversationId) {
      try {
        await fetch(getApiUrl(`/api/conversations/${activeConversationId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId })
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, datasetId } : c))
        );
      } catch (err) {
        console.error('Failed to attach dataset to conversation:', err);
      }
    }
  };

  const handleSelectDataset = async (id, targetView = null) => {
    await handleAttachDatasetToConversation(id);
    if (targetView === 'keep') {
      return;
    }
    const nextView = targetView || (currentView === 'dashboard' ? 'dashboard' : 'chat');
    setCurrentView(nextView);
    if (nextView === 'chat') {
      setActiveTab('chat');
    }
  };

  const handleDatasetUploaded = async (uploadedData) => {
    const id = typeof uploadedData === 'string' ? uploadedData : uploadedData?.datasetId;
    if (id) {
      await fetchDatasets();
      await fetchSystemStatus();
      await handleAttachDatasetToConversation(id);
      setCurrentView('dashboard');
      setActiveTab('overview');
    }
  };

  const handleDeleteDataset = async (datasetIdToDelete) => {
    try {
      const res = await fetch(getApiUrl(`/api/datasets/${datasetIdToDelete}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        setDatasets((prev) => prev.filter((d) => d.id !== datasetIdToDelete));
        fetchSystemStatus();
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
        fetchSystemStatus();
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
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-w-0">
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
            onExecutePrompt={(promptText) => {
              setCurrentView('chat');
              setActiveTab('chat');
              setSearchTrigger(promptText);
            }}
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
          <div className="saas-card p-6 bg-gradient-to-r from-[#0E1628] via-[#111C30] to-[#0E1628] border border-white/10">
            <h1 className="text-2xl font-extrabold text-[#F1F5F9] tracking-tight">Analytics Hub</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Deterministic DuckDB columnar execution metrics and SQLite persistence health.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">DuckDB Columnar Engine</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">Status: Active &amp; Isolated</p>
              <p className="text-[11px] text-slate-400 mt-2">
                100% deterministic arithmetic. Sums, averages, rankings, and filters computed directly in DuckDB.
              </p>
            </div>

            <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">SQLite Persistence</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {datasets.length} Datasets • {conversations.length} Threads
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                ACID transactional metadata, cascading deletes, and WAL durability enabled.
              </p>
            </div>

            <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">Dataset Isolation</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">UUID Enforced</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Zero cross-dataset leakage. All table names scoped to unique dataset IDs.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'charts') {
      return (
        <ChartStudioView
          dataset={activeDataset}
          onUploadClick={() => setCurrentView('datasets')}
          onViewDatasets={() => setCurrentView('datasets')}
          onAskInChat={(q) => {
            setCurrentView('chat');
            setActiveTab('chat');
            setSearchTrigger(q);
          }}
        />
      );
    }

    if (currentView === 'insights') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <InsightsView
            dataset={activeDataset}
            onAskQuestion={(q) => {
              setCurrentView('chat');
              setActiveTab('chat');
              setSearchTrigger(q);
            }}
          />
        </div>
      );
    }

    if (currentView === 'explorer') {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <button
              type="button"
              onClick={() => setExplorerTab('schema')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                explorerTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white bg-[#111C30]'
              }`}
            >
              Schema Profiling
            </button>
            <button
              type="button"
              onClick={() => setExplorerTab('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                explorerTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white bg-[#111C30]'
              }`}
            >
              Raw Data Preview
            </button>
          </div>

          {explorerTab === 'preview' ? (
            <PreviewView
              dataset={activeDataset}
              onBackToChat={() => {
                setCurrentView('chat');
                setActiveTab('chat');
              }}
              onExportCsv={handleExportCsv}
            />
          ) : (
            <SchemaView
              dataset={activeDataset}
              onBackToChat={() => {
                setCurrentView('chat');
                setActiveTab('chat');
              }}
              onAskAboutColumn={(col) => {
                setCurrentView('chat');
                setActiveTab('chat');
                setSearchTrigger(`Analyze column ${col} in detail`);
              }}
            />
          )}
        </div>
      );
    }

    // 2. Active Tab Views inside Dataset Context (Overview, Schema, Preview, Insights, Chat)
    if (activeTab === 'overview') {
      return (
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
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
            onExecutePrompt={(promptText) => {
              setActiveTab('chat');
              setSearchTrigger(promptText);
            }}
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
            datasets={datasets}
            activeConversationId={activeConversationId}
            searchTrigger={searchTrigger}
            onClearSearchTrigger={() => setSearchTrigger(null)}
            onConversationChange={(newId) => {
              setActiveConversationId(newId);
              fetchConversations(newId);
            }}
            onDatasetChange={(newDsId) => {
              if (newDsId) {
                setActiveDatasetId(newDsId);
                fetchDatasetSchema(newDsId);
              } else {
                setActiveDatasetId(null);
                setActiveDataset(null);
              }
            }}
            onAttachDataset={handleAttachDatasetToConversation}
            onUploadClick={() => setCurrentView('datasets')}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Right Dataset Context Panel (Matches Reference Image) */}
        <div className="hidden xl:block w-80 p-4 border-l border-white/[0.08] overflow-y-auto bg-[#0A0F1D] flex-shrink-0">
          <DatasetOverviewPanel
            dataset={activeDataset}
            datasets={datasets}
            onSelectDataset={handleSelectDataset}
            onUploadClick={() => setCurrentView('datasets')}
            onViewAllDatasets={() => setCurrentView('datasets')}
            onViewSchema={() => setActiveTab('schema')}
            onViewInsights={() => setActiveTab('insights')}
            onManageConversations={() => setCurrentView('conversations')}
            onExportCsv={handleExportCsv}
            onOpenHelp={() => setHelpModalOpen(true)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#06080F] font-sans antialiased text-[#F1F5F9] overflow-x-hidden">
      {/* 1. Left Dark Navy Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === 'chat') setActiveTab('chat');
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
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        systemStatus={systemStatus}
      />

      {/* 2. Workspace Body (Pushed by 240px Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 transition-all bg-[#06080F] min-w-0">
        {/* Top Header Search Bar & User Nav */}
        <TopNav
          onGlobalSearch={handleGlobalSearch}
          onOpenMobileMenu={() => setMobileOpen(true)}
          activeDataset={activeDataset}
          onOpenUpgrade={() => setProModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          systemStatus={systemStatus}
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
        <main className={`flex-1 flex flex-col min-w-0 w-full ${currentView === 'chat' && activeTab === 'chat' ? 'overflow-hidden min-h-0' : 'overflow-y-auto'} bg-[#06080F]`}>
          {renderMainContent()}
        </main>
      </div>

      {/* Upgrade to Pro Modal */}
      {proModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0E1628] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setProModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(91,92,240,0.35)]">
              <Crown className="w-6 h-6 text-amber-300" />
            </div>

            <h3 className="text-xl font-extrabold text-[#F1F5F9] tracking-tight">
              DataMind AI Pro
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
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
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
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
                className="btn-gradient w-full py-2.5 text-xs text-center cursor-pointer shadow-lg"
              >
                Join Priority Waitlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0E1628] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Application Settings</h3>
                <p className="text-xs text-slate-400">Configure engine and presentation preferences</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#111C30] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">DuckDB Columnar Engine</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Active</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Queries execute deterministically using zero-latency in-memory DuckDB tables.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111C30] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">SQLite Persistence (analyst.db)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">WAL Enabled</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  ACID conversation threads, messages, and uploaded datasets are preserved across restarts.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Default Currency Symbol</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">₹ (INR)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#111C30] border border-white/10 text-slate-400 font-medium">$ (USD)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#111C30] border border-white/10 text-slate-400 font-medium">€ (EUR)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="btn-gradient px-4 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0E1628] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">DataMind AI Help &amp; Guide</h3>
                <p className="text-xs text-slate-400">How to get the most out of your conversational analyst</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#111C30] border border-white/10">
                <p className="font-bold text-slate-200 mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div><kbd className="px-1.5 py-0.5 rounded bg-[#0B1220] border border-white/10 font-mono font-bold text-slate-300">⌘N / Ctrl+N</kbd> New Conversation</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-[#0B1220] border border-white/10 font-mono font-bold text-slate-300">Enter</kbd> Send Analysis Query</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-[#0B1220] border border-white/10 font-mono font-bold text-slate-300">Shift+Enter</kbd> Multiline Query</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-[#0B1220] border border-white/10 font-mono font-bold text-slate-300">Esc</kbd> Close Active Modal</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111C30] border border-white/10">
                <p className="font-bold text-slate-200 mb-1.5">Analytical Question Types</p>
                <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">Rankings &amp; Top-N:</strong> "Show top 5 products by revenue"</li>
                  <li><strong className="text-slate-200">Time Trends:</strong> "Show monthly sales trend from Jan to Dec"</li>
                  <li><strong className="text-slate-200">Aggregations:</strong> "What is total revenue and average order value?"</li>
                  <li><strong className="text-slate-200">Categorical Breakdowns:</strong> "Break down sales by region or category"</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="font-bold text-indigo-300 mb-0.5">Deterministic DuckDB Arithmetic</p>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Every number, metric, and percentage is calculated directly against actual dataset values using DuckDB SQL, never hallucinated by AI.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end mt-5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="btn-gradient px-4 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
