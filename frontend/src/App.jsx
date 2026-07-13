import { useState, useEffect } from 'react';
import SidebarExplorer from './components/SidebarExplorer';
import ContentPreviewPanel from './components/ContentPreviewPanel';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openFolders, setOpenFolders] = useState({});
  const [uiState, setUiState] = useState({ error: '', success: '' });
  const [fileCache, setFileCache] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

  // 🔥 Helper function to trigger a self-dismissing notification banner
  const triggerToast = (type, message) => {
    setUiState({
      error: type === 'error' ? message : '',
      success: type === 'success' ? message : ''
    });

    // Auto-wipe the notification box after exactly 3 seconds
    setTimeout(() => {
      setUiState({ error: '', success: '' });
    }, 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND_URL}/directory`)
      .then((res) => res.json())
      .then((data) => { setTreeData(data); if (data?.fullPath) setOpenFolders({ [data.fullPath]: true }); })
      .catch((err) => triggerToast('error', err.message));
  }, []);

  useEffect(() => {
    if (!selectedNode || selectedNode.isDirectory || selectedNode.name === 'root') { 
      setMarkdownContent(''); 
      setIsEditing(false); 
      return; 
    }
    setUiState({ error: '', success: '' }); 
    setIsEditing(false);

    if (fileCache[selectedNode.fullPath] !== undefined) {
      setMarkdownContent(fileCache[selectedNode.fullPath]);
      return;
    }
    fetchFileFromDatabase();
  }, [selectedNode]);

  const fetchFileFromDatabase = (isManualRefresh = false) => {
    setIsLoadingContent(true);
    fetch(`${BACKEND_URL}/content?path=${encodeURIComponent(selectedNode.fullPath)}`)
      .then((res) => res.json())
      .then((data) => {
        const text = data.textData || '';
        setMarkdownContent(text);
        setFileCache(prev => ({ ...prev, [selectedNode.fullPath]: text }));
        if (isManualRefresh) triggerToast('success', 'Fresh content loaded!');
      })
      .catch((err) => triggerToast('error', err.message))
      .finally(() => setIsLoadingContent(false));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/update-file-content`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath: selectedNode.fullPath, updates: { textData: markdownContent } })
      });
      if (!res.ok) throw new Error('Failed to commit modifications.');
      
      setFileCache(prev => ({ ...prev, [selectedNode.fullPath]: markdownContent }));
      triggerToast('success', 'Changes saved safely!');
      setIsEditing(false);
    } catch (err) { 
      triggerToast('error', err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    // 🔥 CHANGED: Hardlocked container to full screen bounds, stripped max-w blocks, killed global scroll
    <div className="w-screen h-screen bg-slate-50 text-slate-800 px-6 py-4 flex flex-col overflow-hidden relative">
      
      {/* Toast notifications container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none items-center">
        {uiState.error && <div className="bg-red-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium">{uiState.error}</div>}
        {uiState.success && <div className="bg-emerald-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium">{uiState.success}</div>}
      </div>

      {/* Header element - acts as shrinking baseline content */}
      <header className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">App Workspace Bridge</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-Performance Dynamic Cached File Editing Studio</p>
        </div>
        
        {selectedNode && !selectedNode.isDirectory && !isEditing && (
          <button
            onClick={() => fetchFileFromDatabase(true)}
            disabled={isLoadingContent}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw size={12} className={isLoadingContent ? "animate-spin" : ""} />
            <span>Refresh Content</span>
          </button>
        )}
      </header>
      
      {/* 🔥 CHANGED: Grid container now takes remaining viewport space ('flex-1 min-h-0') */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0 pb-2">
        <SidebarExplorer activeDisplayTree={focusedNode || treeData} selectedNode={selectedNode} onSelect={setSelectedNode} openFolders={openFolders} setOpenFolders={setOpenFolders} focusedNode={focusedNode} onFocus={setFocusedNode} />
        <ContentPreviewPanel selectedNode={selectedNode} isLoadingContent={isLoadingContent} isEditing={isEditing} setIsEditing={setIsEditing} isSaving={isSaving} markdownContent={markdownContent} setMarkdownContent={setMarkdownContent} onSave={handleSaveChanges} />
      </div>
    </div>
  );
}