import { useState, useEffect } from 'react';
import { FileText, Save, FolderOpen, AlertCircle, CheckCircle2, Folder, ChevronRight, FilePlus } from 'lucide-react';

export default function App() {
  // Navigation & File States
  const [currentPath, setCurrentPath] = useState(''); 
  const [dirData, setDirData] = useState({ parentPath: '', items: [] });
  const [activeFilePath, setActiveFilePath] = useState('');
  const [content, setContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  
  // Status Banner State
  const [status, setStatus] = useState({ type: '', message: '' });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const showAlert = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  // 1. Fetch directory contents from the backend
  const fetchDirectory = async (pathToSend = '') => {
    try {
      const response = await fetch(`${BACKEND_URL}/directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathToSend }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch directory');
      
      setCurrentPath(data.currentPath);
      setDirData({ parentPath: data.parentPath, items: data.items });
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Load initial root directory on mount
  useEffect(() => {
    fetchDirectory();
  }, []);

  // 2. Load content of a specific markdown file
  const loadFile = async (filePath) => {
    try {
      const response = await fetch(`${BACKEND_URL}/file/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to read file');

      setActiveFilePath(filePath);
      setContent(data.content);
      showAlert('success', `Opened: ${filePath.split('/').pop()}`);
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // 3. Save existing file changes
  const saveFile = async () => {
    if (!activeFilePath) {
      showAlert('error', 'No file is currently open to save.');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/file/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: activeFilePath, content }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }
      showAlert('success', 'File saved successfully!');
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // 4. Create a completely new .md file in the current directory
  const createNewFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    // Standardize naming to guarantee .md extension
    const cleanName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const fullNewPath = `${currentPath}/${cleanName}`;

    try {
      const response = await fetch(`${BACKEND_URL}/file/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fullNewPath, content: '# New Markdown File\n' }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create file');
      }

      setNewFileName('');
      showAlert('success', `Created ${cleanName}`);
      // Refresh directory view and immediately load the new file
      await fetchDirectory(currentPath);
      loadFile(fullNewPath);
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">App Markdown Bridge Workspace</h1>
            <p className="text-xs text-slate-500 mt-0.5">Active Target Path: <span className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">{currentPath || 'Loading...'}</span></p>
          </div>
          
          {status.message && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs shadow-xs transition-all ${
              status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {status.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span>{status.message}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* File Browser Sidebar */}
          <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[550px]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">File Explorer</h2>
            
            {/* Folder Navigation List */}
            <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1 text-sm">
              {currentPath && dirData.parentPath !== currentPath && (
                <button 
                  onClick={() => fetchDirectory(dirData.parentPath)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer font-medium"
                >
                  <ChevronRight size={14} className="rotate-180 text-slate-400" />
                  <span>.. [Go Back]</span>
                </button>
              )}

              {dirData.items.map((item) => (
                <button
                  key={item.fullPath}
                  onClick={() => item.isDirectory ? fetchDirectory(item.fullPath) : loadFile(item.fullPath)}
                  className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md transition-colors cursor-pointer break-all ${
                    activeFilePath === item.fullPath 
                      ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {item.isDirectory ? (
                    <Folder size={15} className="text-amber-500 fill-amber-400 shrink-0" />
                  ) : (
                    <FileText size={15} className="text-blue-500 shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>

            {/* Inline File Creation Form */}
            <form onSubmit={createNewFile} className="border-t border-slate-100 pt-3 flex gap-2">
              <input
                type="text"
                placeholder="New note name..."
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-md transition-colors cursor-pointer"
                title="Create File"
              >
                <FilePlus size={14} />
              </button>
            </form>
          </aside>

          {/* Text Editor Workspace */}
          <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[550px]">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <span className="text-xs font-mono text-slate-600 truncate max-w-md">
                  {activeFilePath ? activeFilePath.split('/').pop() : 'No file selected (Scratchpad)'}
                </span>
              </div>
              <button 
                onClick={saveFile} 
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
            <textarea
              className="w-full flex-1 p-5 font-mono text-sm leading-relaxed border-0 focus:outline-hidden resize-none overflow-y-auto bg-slate-25/30"
              placeholder="# Markdown Workspace&#10;&#10;Select a file from the sidebar explorer to edit or create a new one below."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </main>

        </div>
      </div>
    </div>
  );
}