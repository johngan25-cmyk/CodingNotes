import { useState, useEffect } from 'react';
import { FolderOpen, Folder, FileText, ChevronRight, ChevronDown, Monitor } from 'lucide-react';

// Recursive Component to handle expandable folders and file item selection
function FileNode({ node, selectedNode, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!node) return null;

  const isSelected = selectedNode?.fullPath === node.fullPath;

  // File Row Layout
  if (!node.isDirectory) {
    return (
      <button
        onClick={() => onSelect(node)}
        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer pl-6 ${
          isSelected 
            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100' 
            : 'hover:bg-slate-50 text-slate-600'
        }`}
      >
        <FileText size={15} className="text-blue-500 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  // Folder Row Layout with recursive rendering of children
  return (
    <div className="w-full">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onSelect(node);
        }}
        className={`w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          isSelected 
            ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200' 
            : 'hover:bg-slate-50 text-slate-700'
        }`}
      >
        <span className="text-slate-400 shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <FolderOpen size={15} className="text-amber-500 fill-amber-400 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>

      {isOpen && node.children && (
        <div className="pl-3 border-l border-slate-100 ml-3 mt-0.5 space-y-0.5">
          {node.children.map((child, index) => (
            <FileNode 
              key={child.fullPath || index} 
              node={child} 
              selectedNode={selectedNode} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState('');

  // Using GET as discussed since it's a direct fetch now
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${BACKEND_URL}/directory`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tree metadata');
        return res.json();
      })
      .then((data) => setTreeData(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">App Markdown Bridge Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">Static Layout & Tree Navigation Framework</p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-xs mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Tree Explorer Sidebar Container */}
          <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[500px]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Workspace Tree</h2>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {treeData ? (
                <FileNode 
                  node={treeData} 
                  selectedNode={selectedNode} 
                  onSelect={setSelectedNode} 
                />
              ) : (
                <p className="text-xs text-slate-400 p-2 italic">Loading directory tree structure...</p>
              )}
            </div>
          </aside>

          {/* Simple Display Monitor Area */}
          <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[500px]">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <Monitor size={15} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Selection Inspection Panel</span>
            </div>
            
            <div className="p-6 flex flex-col justify-center items-center h-full text-center">
              {selectedNode ? (
                <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-left text-xs space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold">NAME:</span> 
                    <span className="text-slate-800 ml-2 font-semibold text-sm">{selectedNode.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">TYPE:</span> 
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedNode.isDirectory ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedNode.isDirectory ? 'DIRECTORY' : 'MARKDOWN FILE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">FULL ABSOLUTE PATH:</span>
                    <p className="text-slate-600 mt-1 bg-white p-2 border border-slate-200 rounded break-all">{selectedNode.fullPath}</p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">
                  <Folder size={40} className="mx-auto mb-2 opacity-40 stroke-1" />
                  <p className="text-sm">Click any item in the tree explorer to view its system path data structure.</p>
                </div>
              )}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}