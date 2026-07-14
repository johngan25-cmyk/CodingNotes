import { RefreshCw } from "lucide-react";

export default function WorkspaceHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  selectedNode,
  isLoadingContent,
  onRefresh,
}) {
  return (
    <header className="mb-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors cursor-pointer flex items-center justify-center shadow-xs"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          )}
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            App Workspace Bridge
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            High-Performance Dynamic Cached File Editing Studio
          </p>
        </div>
      </div>

      {selectedNode && !selectedNode.isDirectory && (
        <button
          onClick={onRefresh}
          disabled={isLoadingContent}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw
            size={12}
            className={isLoadingContent ? "animate-spin" : ""}
          />
          <span>Refresh Content</span>
        </button>
      )}
    </header>
  );
}