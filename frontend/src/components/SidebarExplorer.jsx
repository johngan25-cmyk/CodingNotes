import React from "react";
import { ArrowLeft } from "lucide-react";
import FileNode from "./FileNode";
import TreeActionsToolbar from "./TreeActionsToolbar";
import { useTreeSync } from "../hooks/useTreeSync";
import { executeTreeAction } from "../utils/treeOperations";
import api from "../services/axiosInstance.js";
export default function SidebarExplorer({
  activeDisplayTree,
  selectedNode,
  onSelect,
  openFolders,
  setOpenFolders,
  focusedNode,
  onFocus,
}) {
  const { localTree, pushTreeSnapshotToServer } = useTreeSync(
    activeDisplayTree,
    onSelect,
  );

  const handleToolbarAction = async (actionType) => {
    const result = executeTreeAction({
      actionType,
      localTree,
      selectedNode,
      setOpenFolders,
    });

    // If the action returned a modified tree state object, commit it to the backend database
    if (result?.updatedTree) {
      const nextSelection =
        result.targetSelection !== undefined
          ? result.targetSelection
          : result.shouldClearSelection
            ? null
            : undefined;
      if (
        Array.isArray(result.deletedFilePathsArray) &&
        result.deletedFilePathsArray.length > 0
      ) {
        api
          .delete("/delete-file-content", {
            data: { targetPaths: result.deletedFilePathsArray },
          })
          .catch((err) =>
            console.error("Content cleanup failed:", err.message),
          );

      }

      // 2. Clean up link resources
      if (
        Array.isArray(result.deletedLinkPathsArray) &&
        result.deletedLinkPathsArray.length > 0
      ) {
        result.deletedLinkPathsArray.forEach((path) => {
          api
            .delete("/delete-link", {
              data: { resourcePath: path },
            })
            .catch((err) => console.error("Link database cleanup failed:", err.message));
        });
      }
      
      try {
        // 1. Sync the filesystem tree layout first
        await pushTreeSnapshotToServer(result.updatedTree, nextSelection);

        // 2. If it was a new file creation action, auto-provision its database text entry immediately
        if (actionType === "ADD_FILE" && result.targetSelection) {
          const defaultText = `# hello`;

          await api.post("/add-file-content", {
            filePath: result.targetSelection.fullPath,
            textData: defaultText,
          });
        }
        if (actionType === "ADD_LINK" && result.targetSelection) {
          await api.post("/create-link", {
            resourcePath: result.targetSelection.fullPath,
            destinationUrl: result.targetSelection.destinationUrl,
          });
        }
      } catch (err) {
        console.error("Auto-initialization chain failed:", err.message);
      }
    }
  };

  return (
    <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {focusedNode ? `Scope: ${focusedNode.name}` : "Workspace Tree"}
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

      <TreeActionsToolbar
        selectedNode={selectedNode}
        onAction={handleToolbarAction}
      />

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
          <p className="text-xs text-slate-400 p-2 italic">
            Loading workspace...
          </p>
        )}
      </div>
    </aside>
  );
}
