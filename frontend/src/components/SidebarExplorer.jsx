import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import FileNode from './FileNode';
import TreeActionsToolbar from './TreeActionsToolbar';

export default function SidebarExplorer({ activeDisplayTree, selectedNode, onSelect, openFolders, setOpenFolders, focusedNode, onFocus }) {
  const [localTree, setLocalTree] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (activeDisplayTree) {
      setLocalTree(JSON.parse(JSON.stringify(activeDisplayTree)));
    }
  }, [activeDisplayTree]);

  // Unified fetch pipeline to push the modified tree snapshot to the shared endpoint
  const pushTreeSnapshotToServer = (updatedTreeObject, optionalNewSelectNode = null) => {
    fetch(`${BACKEND_URL}/sync-directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modifiedTreeData: updatedTreeObject })
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to sync tree changes to the server.");
      setLocalTree(updatedTreeObject);
      if (optionalNewSelectNode !== null) {
        onSelect(optionalNewSelectNode);
      }
    })
    .catch(err => alert(err.message));
  };

  const insertNodeIntoTree = (node, parentPath, newNode) => {
    if (node.fullPath === parentPath) {
      if (!node.children) node.children = [];
      node.children.push(newNode);
      return true;
    }
    if (node.children) {
      for (let child of node.children) {
        if (insertNodeIntoTree(child, parentPath, newNode)) return true;
      }
    }
    return false;
  };

  const removeNodeFromTree = (node, targetPath) => {
    if (node.children) {
      const index = node.children.findIndex(child => child.fullPath === targetPath);
      if (index !== -1) {
        node.children.splice(index, 1);
        return true;
      }
      for (let child of node.children) {
        if (removeNodeFromTree(child, targetPath)) return true;
      }
    }
    return false;
  };

  const handleToolbarAction = (actionType) => {
    if (!localTree) return;

    let targetFolder = selectedNode;
    if (!targetFolder || !targetFolder.isDirectory) {
      targetFolder = (selectedNode && !selectedNode.isDirectory) 
        ? { fullPath: selectedNode.fullPath.substring(0, selectedNode.fullPath.lastIndexOf('/')) }
        : localTree;
    }

    switch(actionType) {
      case 'ADD_FILE': {
        const name = prompt("Enter new file name:");
        if (!name) return;

        const newFilePath = `${targetFolder.fullPath}/${name}`.replace(/\/+/g, '/');
        const newFileNode = { name, fullPath: newFilePath, isDirectory: false };

        const treeCopy = { ...localTree };
        insertNodeIntoTree(treeCopy, targetFolder.fullPath, newFileNode);
        
        pushTreeSnapshotToServer(treeCopy, newFileNode);
        setOpenFolders(prev => ({ ...prev, [targetFolder.fullPath]: true }));
        break;
      }

      case 'ADD_FOLDER': {
        const name = prompt("Enter new folder name:");
        if (!name) return;

        const newFolderPath = `${targetFolder.fullPath}/${name}`.replace(/\/+/g, '/');
        const newFolderNode = { name, fullPath: newFolderPath, isDirectory: true, children: [] };

        const treeCopy = { ...localTree };
        insertNodeIntoTree(treeCopy, targetFolder.fullPath, newFolderNode);
        
        pushTreeSnapshotToServer(treeCopy);
        setOpenFolders(prev => ({ ...prev, [targetFolder.fullPath]: true }));
        break;
      }

      case 'DELETE': {
        if (!selectedNode || selectedNode.name === 'root') return;
        if (!window.confirm(`Permanently delete "${selectedNode.name}"?`)) return;

        const treeCopy = { ...localTree };
        removeNodeFromTree(treeCopy, selectedNode.fullPath);
        
        pushTreeSnapshotToServer(treeCopy, null);
        break;
      }

      case 'COLLAPSE_ALL':
        setOpenFolders(localTree.fullPath ? { [localTree.fullPath]: true } : {});
        break;
      default:
        break;
    }
  };

  return (
    <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2 shrink-0">
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

      <TreeActionsToolbar selectedNode={selectedNode} onAction={handleToolbarAction} />

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
        {localTree ? (
          <FileNode 
            node={localTree} 
            selectedNode={selectedNode} 
            onSelect={onSelect}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            onFocus={onFocus}
          />
        ) : (
          <p className="text-xs text-slate-400 p-2 italic">Loading workspace...</p>
        )}
      </div>
    </aside>
  );
}