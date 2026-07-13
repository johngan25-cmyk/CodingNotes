import { ArrowLeft } from 'lucide-react';
import FileNode from './FileNode';

export default function SidebarExplorer({ activeDisplayTree, selectedNode, onSelect, openFolders, setOpenFolders, focusedNode, onFocus }) {
  return (
    <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl px-1 py-4 shadow-xs flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {focusedNode ? `Scope: ${focusedNode.name}` : 'Workspace Tree'}
        </h2>
        {focusedNode && (
          <button 
            onClick={() => onFocus(null)}
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
            onSelect={onSelect}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            onFocus={onFocus}
          />
        ) : (
          <p className="text-xs text-slate-400 p-2 italic">Loading layout...</p>
        )}
      </div>
    </aside>
  );
}