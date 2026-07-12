import { useState, useEffect } from 'react';
import { Folder, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Clean coding theme
import FileNode from './components/FileNode';

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
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

  useEffect(() => {
    if (!selectedNode) {
      setMarkdownContent('');
      return;
    }

    const isFolder = selectedNode.isDirectory || selectedNode.name === 'root';
    
    if (!isFolder && selectedNode.fullPath) {
      setIsLoadingContent(true);
      setError('');
      
      fetch(`${BACKEND_URL}/content?path=${encodeURIComponent(selectedNode.fullPath)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Could not read file contents from database');
          return res.json();
        })
        .then((data) => {
          setMarkdownContent(data.textData || '');
        })
        .catch((err) => {
          setError(err.message);
          setMarkdownContent('');
        })
        .finally(() => {
          setIsLoadingContent(false);
        });
    } else {
      setMarkdownContent('');
    }
  }, [selectedNode]);

  const activeDisplayTree = focusedNode || treeData;
  const fileExtension = selectedNode?.name?.split('.').pop()?.toLowerCase();
const highlightLanguage = fileExtension === 'html' ? 'html' : 'markdown';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">App Markdown Bridge Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-Performance Clean Layout & Code Workspace View</p>
        </header>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-xs mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tree Explorer Sidebar */}
          <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[650px]">
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
              {activeDisplayTree ? (
                <FileNode 
                  node={activeDisplayTree} 
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

          {/* Main Inspection & Raw Formatter Panel */}
          <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[650px]">
            {selectedNode ? (
              <div className="flex flex-col h-full">
                {/* Document Metadata Bar */}
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <span className="font-semibold text-slate-900 text-sm truncate">{selectedNode.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono truncate max-w-xs">
                    {selectedNode.fullPath}
                  </span>
                </div>

                {/* Updated Content Viewer Window */}
<div className="flex-1 bg-white min-h-0 relative">
  {isLoadingContent ? (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
      <Loader2 className="animate-spin text-blue-500" size={24} />
      <p className="text-xs">Fetching file contents...</p>
    </div>
  ) : (selectedNode.isDirectory || selectedNode.name === 'root') ? (
    <div className="m-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-xs font-medium">
      Folder Node Selected. Open nested items in the explorer panel to inspect content.
    </div>
  ) : highlightLanguage === 'html' ? (
    /* 🔥 SANDBOXED IFRAME FOR FULL WEBPAGE DOCUMENTS */
    <iframe
      title="HTML Note Preview"
      srcDoc={markdownContent}
      sandbox="allow-scripts" // Allows internal JS to execute safely inside the frame
      className="w-full h-full border-0 absolute inset-0"
    />
  ) : (
    /* 📄 SHOW CODE FORMATTER FOR .md FILES */
    <div className="h-full overflow-auto font-mono text-xs">
      <SyntaxHighlighter 
        language="markdown" 
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: '#ffffff',
          fontSize: '0.8rem',
          lineHeight: '1.5',
          height: '100%',
          width: '100%'
        }}
        wrapLongLines={true}
      >
        {markdownContent}
      </SyntaxHighlighter>
    </div>
  )}
</div>
              </div>
            ) : (
              <div className="p-6 flex flex-col justify-center items-center h-full text-center">
                <Folder size={40} className="mx-auto mb-2 opacity-30 stroke-1 text-slate-400" />
                <p className="text-sm text-slate-400">Click any document in the tree explorer sidebar to load its formatted markdown source.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}