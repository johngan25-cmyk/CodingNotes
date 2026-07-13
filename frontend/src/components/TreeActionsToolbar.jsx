import { FilePlus2, FolderPlus, Trash2, FolderMinus } from 'lucide-react';

export default function TreeActionsToolbar({ selectedNode, onAction }) {
  // Determine text description helper contextual labels
  const getDeleteTargetText = () => {
    if (!selectedNode) return "Delete Item";
    if (selectedNode.name === 'root') return "Cannot Delete Root Workspace";
    return selectedNode.isDirectory 
      ? `Delete Folder "${selectedNode.name}" & all nested contents` 
      : `Delete File "${selectedNode.name}"`;
  };

  const isDeleteDisabled = !selectedNode || selectedNode.name === 'root';

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 shadow-xs mb-3 shrink-0">
      {/* 1. Add File Action */}
      <button
        onClick={() => onAction('ADD_FILE')}
        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-md transition-all cursor-pointer group"
        title="Add New File"
      >
        <FilePlus2 size={14} />
      </button>

      {/* 2. Add Folder Action */}
      <button
        onClick={() => onAction('ADD_FOLDER')}
        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-md transition-all cursor-pointer group"
        title="Add New Folder"
      >
        <FolderPlus size={14} />
      </button>

      {/* 3. Collapse All Action */}
      <button
        onClick={() => onAction('COLLAPSE_ALL')}
        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-white rounded-md transition-all cursor-pointer group"
        title="Collapse All Folders"
      >
        <FolderMinus size={14} />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* 4. Contextual Delete Action */}
      <button
        onClick={() => !isDeleteDisabled && onAction('DELETE')}
        disabled={isDeleteDisabled}
        className={`p-1.5 rounded-md transition-all ${
          isDeleteDisabled 
            ? 'text-slate-300 cursor-not-allowed opacity-50' 
            : 'text-slate-600 hover:text-red-600 hover:bg-white cursor-pointer'
        }`}
        title={getDeleteTargetText()}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}