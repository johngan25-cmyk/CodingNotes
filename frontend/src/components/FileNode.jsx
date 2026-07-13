import { useState } from "react";
import {
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Target,
} from "lucide-react";

export default function FileNode({
  node,
  selectedNode,
  onSelect,
  openFolders,
  setOpenFolders,
  onFocus,
}) {
  if (!node) return null;

  const isSelected = selectedNode?.fullPath === node.fullPath;
  const isFolder = node.isDirectory || node.name === "root";
  const isOpen = openFolders[node.fullPath] || false;

  const handleToggleFolder = (e) => {
  e.stopPropagation();

  const newOpenState = !isOpen;
  const updatedOpenFolders = { ...openFolders };

  if (newOpenState) {
    // Find the parent path to handle accordion auto-collapse
    const lastSlashIndex = node.fullPath.lastIndexOf("/");
    const parentPath =
      lastSlashIndex !== -1
        ? node.fullPath.substring(0, lastSlashIndex)
        : "root";

    // Collapse open siblings
    Object.keys(updatedOpenFolders).forEach((path) => {
      // 🔥 SAFETY GUARD: If the folder path we are checking is a parent/ancestor 
      // of the folder we are currently opening, skip it so it stays open!
      if (node.fullPath && node.fullPath.startsWith(path)) {
        return;
      }

      const siblingSlashIndex = path.lastIndexOf("/");
      const siblingParentPath =
        siblingSlashIndex !== -1
          ? path.substring(0, siblingSlashIndex)
          : "root";
      
      if (siblingParentPath === parentPath && path !== node.fullPath) {
        updatedOpenFolders[path] = false;
      }
    });
    updatedOpenFolders[node.fullPath] = true;
  } else {
    updatedOpenFolders[node.fullPath] = false;
  }

  setOpenFolders(updatedOpenFolders);
  onSelect(node); // Sets the folder as selected in the main app layout
};

  if (!isFolder) {
    return (
      <button
        onClick={() => onSelect(node)}
        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer pl-6 border border-transparent ${
          isSelected
            ? "bg-blue-50 text-blue-700 font-semibold border-blue-100"
            : "hover:bg-slate-50 text-slate-600"
        }`}
      >
        <FileText size={15} className="text-blue-500 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      <div 
      className={`group/row w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer border border-transparent ${
        isSelected ? 'bg-slate-100 text-slate-900 font-bold border-slate-200' : 'hover:bg-slate-50 text-slate-700'
      }`}
      onClick={handleToggleFolder} // Clean click execution handler
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-slate-400 shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <FolderOpen size={15} className="text-amber-500 fill-amber-400 shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>

      {node.name !== 'root' && (
        <button
          onClick={(e) => { e.stopPropagation(); onFocus(node); }}
          title="Focus scope on this folder"
          className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-opacity cursor-pointer ml-1"
        >
          <Target size={13} />
        </button>
      )}
    </div>

      {isOpen && node.children && Array.isArray(node.children) && (
        <div className="pl-1 border-l border-slate-200/80 ml-3.5 mt-0.5 space-y-0.5 transition-all">
          {node.children.map((child, index) => (
            <FileNode
              key={
                child.fullPath || `${node.fullPath || "root"}-child-${index}`
              }
              node={child}
              selectedNode={selectedNode}
              onSelect={onSelect}
              openFolders={openFolders}
              setOpenFolders={setOpenFolders}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
