import { useState, useEffect } from 'react';
import { Folder, ArrowLeft } from 'lucide-react';
import FileNode from './components/FileNode';
import Breadcrumbs from './components/Breadcrumbs';

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [openFolders, setOpenFolders] = useState({});
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetch(`${BACKEND_URL}/directory`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tree metadata');
        return res.json();
      })
      .then((data) => {
        setTreeData(data);
        if (data?.fullPath) setOpenFolders({ [data.fullPath]: true });
      })
      .catch((err) => setError(err.message));
  }, []);

  const buildBreadcrumbs = () => {
  if (!selectedNode || !treeData) return [];

  const path = [];
  
  // Helper to trace the node lineage from root to selection
  const traverse = (currentNode, targetId, currentTrail) => {
    if (!currentNode) return false;
    
    const newTrail = [...currentTrail, { name: currentNode.name, id: currentNode.id || currentNode.fullPath }];
    
    // Check match on ID (or fallback to fullPath if ID isn't there yet)
    if ((currentNode.id && currentNode.id === targetId) || currentNode.fullPath === targetId) {
      path.push(...newTrail);
      return true;
    }
    
    if (currentNode.children) {
      for (let child of currentNode.children) {
        if (traverse(child, targetId, newTrail)) return true;
      }
    }
    return false;
  };

  traverse(treeData, selectedNode.id || selectedNode.fullPath, []);
  return path;
};

 const findNodeById = (root, id) => {
  if (!root || !id) return null;
  if (root.id === id || root.fullPath === id || (id === 'root' && root.name === 'root')) {
    return root;
  }
  if (root.children) {
    for (let child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};
 const findNodeAndAncestors = (root, targetId, ancestors = []) => {
  if (!root || !targetId) return null;
  
  const currentKey = root.id || root.fullPath;
  
  if (root.id === targetId || root.fullPath === targetId || (targetId === 'root' && root.name === 'root')) {
    return { node: root, ancestors };
  }
  
  if (root.children) {
    for (let child of root.children) {
      const found = findNodeAndAncestors(child, targetId, [...ancestors, currentKey]);
      if (found) return found;
    }
  }
  return null;
};

const handleBreadcrumbClick = (targetId) => {
  const result = findNodeAndAncestors(treeData, targetId);
  
  if (result) {
    const { node, ancestors } = result;
    setSelectedNode(node);
    
    // Create a new open folder state map containing all ancestors + the target itself
    const newOpenFolders = { ...openFolders };
    ancestors.forEach(id => {
      if (id) newOpenFolders[id] = true;
    });
    
    const nodeKey = node.id || node.fullPath;
    if (nodeKey) newOpenFolders[nodeKey] = true;
    
    setOpenFolders(newOpenFolders);
  }
};
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">App Markdown Bridge Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-Performance Clean Layout & Enhanced Navigation System</p>
        </header>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-xs mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {focusedNode ? `Scope: ${focusedNode.name}` : 'Workspace Tree'}
              </h2>
              {focusedNode && (
                <button 
                  onClick={() => setFocusedNode(null)}
                  className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors font-medium cursor-pointer"
                >
                  <ArrowLeft size={10} />
                  <span>Reset View</span>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {focusedNode || treeData ? (
                <FileNode 
                  node={focusedNode || treeData} 
                  selectedNode={selectedNode} 
                  onSelect={setSelectedNode}
                  openFolders={openFolders}
                  setOpenFolders={setOpenFolders}
                  onFocus={setFocusedNode}
                />
              ) : (
                <p className="text-xs text-slate-400 p-2 italic">Loading directory layout...</p>
              )}
            </div>
          </aside>

          <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
            <Breadcrumbs breadcrumbs={buildBreadcrumbs()} onBreadcrumbClick={handleBreadcrumbClick} />
            
            <div className="p-6 flex flex-col justify-center items-center h-full text-center">
              {selectedNode ? (
                <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-left text-xs space-y-3 shadow-2xs">
                  <div><span className="text-slate-400 font-bold">NAME:</span> <span className="text-slate-800 ml-2 font-semibold text-sm">{selectedNode.name}</span></div>
                  <div>
                    <span className="text-slate-400 font-bold">TYPE:</span> 
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedNode.isDirectory || selectedNode.name === 'root' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {selectedNode.isDirectory || selectedNode.name === 'root' ? 'DIRECTORY' : 'MARKDOWN FILE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">FULL ABSOLUTE PATH:</span>
                    <p className="text-slate-600 mt-1 bg-white p-2 border border-slate-200 rounded break-all shadow-3xs">{selectedNode.fullPath || 'N/A'}</p>
                  </div>
                  {selectedNode.children && <div><span className="text-slate-400 font-bold">CONTENTS SUMMARY:</span> <span className="text-slate-600 ml-2">{selectedNode.children.length} direct elements nested inside.</span></div>}
                </div>
              ) : (
                <div className="text-slate-400">
                  <Folder size={40} className="mx-auto mb-2 opacity-30 stroke-1" />
                  <p className="text-sm">Click any item in the tree explorer sidebar to activate the system navigation tracking elements.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}