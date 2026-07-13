import { useState, useEffect } from "react";
import SidebarExplorer from "./components/SidebarExplorer";
import ContentPreviewPanel from "./components/ContentPreviewPanel";
import { RefreshCw } from "lucide-react";

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openFolders, setOpenFolders] = useState({});
  const [uiState, setUiState] = useState({ error: "", success: "" });
  const [fileCache, setFileCache] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api";

  // 🔥 Helper function to trigger a self-dismissing notification banner
  const triggerToast = (type, message) => {
    setUiState({
      error: type === "error" ? message : "",
      success: type === "success" ? message : "",
    });

    // Auto-wipe the notification box after exactly 3 seconds
    setTimeout(() => {
      setUiState({ error: "", success: "" });
    }, 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND_URL}/sync-directory`)
      .then((res) => res.json())
      .then((data) => {
        setTreeData(data);
        if (data?.fullPath) setOpenFolders({ [data.fullPath]: true });
      })
      .catch((err) => triggerToast("error", err.message));
  }, []);

  useEffect(() => {
    if (
      !selectedNode ||
      selectedNode.isDirectory ||
      selectedNode.name === "root"
    ) {
      setMarkdownContent("");
      return;
    }
    setUiState({ error: "", success: "" });

    // 🔥 Intercept here: The structure is saved, but we skip loading text from DB
    if (selectedNode.isNewUnsaved) {
      const defaultText = `# ${selectedNode.name.replace(/\.[^/.]+$/, "")}\nStart writing here...`;

      setMarkdownContent(defaultText);
      setFileCache((prev) => ({
        ...prev,
        [selectedNode.fullPath]: defaultText,
      }));

      // Clear the temporary flag so subsequent standard clicks load normally
      delete selectedNode.isNewUnsaved;
      return;
    }

    if (fileCache[selectedNode.fullPath] !== undefined) {
      setMarkdownContent(fileCache[selectedNode.fullPath]);
      return;
    }
    fetchFileFromDatabase();
  }, [selectedNode]);

  const fetchFileFromDatabase = (isManualRefresh = false) => {
    setIsLoadingContent(true);
    fetch(
      `${BACKEND_URL}/content?path=${encodeURIComponent(selectedNode.fullPath)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        const text = data.textData || "";
        setMarkdownContent(text);
        setFileCache((prev) => ({ ...prev, [selectedNode.fullPath]: text }));
        if (isManualRefresh) triggerToast("success", "Fresh content loaded!");
      })
      .catch((err) => triggerToast("error", err.message))
      .finally(() => setIsLoadingContent(false));
  };

  const handleSaveChanges = async (content) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/update-file-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPath: selectedNode.fullPath,
          updates: { textData: content },
        }),
      });
      if (!res.ok) throw new Error("Failed to commit modifications.");

      setFileCache((prev) => ({
        ...prev,
        [selectedNode.fullPath]: content,
      }));
      setMarkdownContent(content);
      triggerToast("success", "Changes saved safely!");
    } catch (err) {
      triggerToast("error", err.message);
    } finally{
      setIsSaving(false)
    }
  };

  return (
    // 🔥 CHANGED: Hardlocked container to full screen bounds, stripped max-w blocks, killed global scroll
    <div className="w-screen h-screen bg-slate-50 text-slate-800 px-6 py-4 flex flex-col overflow-hidden relative">
      {/* Toast notifications container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none items-center">
        {uiState.error && (
          <div className="bg-red-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium">
            {uiState.error}
          </div>
        )}
        {uiState.success && (
          <div className="bg-emerald-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium">
            {uiState.success}
          </div>
        )}
      </div>

      {/* Header element - acts as shrinking baseline content */}
      <header className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {/* 🔥 THE SIDEBAR TOGGLE BUTTON */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors cursor-pointer flex items-center justify-center shadow-xs"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? (
              /* Chevron Left Icon (Collapse) */
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
              /* Menu Icon (Expand) */
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
            onClick={() => fetchFileFromDatabase(true)}
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

      {/* 🔥 CHANGED: Grid container now dynamically scales columns based on sidebar toggle */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0 pb-2">
        {/* 📁 SIDEBAR WRAPPER CONTAINER */}
        <div
          className={`min-h-0 ${isSidebarOpen ? "md:col-span-1 flex flex-col" : "hidden"}`}
        >
          <SidebarExplorer
            activeDisplayTree={focusedNode || treeData}
            selectedNode={selectedNode}
            onSelect={setSelectedNode}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            focusedNode={focusedNode}
            onFocus={setFocusedNode}
          />
        </div>

        {/* 🚀 CONTENT PANEL CONTAINER */}
        <div
          className={`min-h-0 flex flex-col ${isSidebarOpen ? "md:col-span-3" : "md:col-span-4"}`}
        >
          <ContentPreviewPanel
            selectedNode={selectedNode}
            isLoadingContent={isLoadingContent}
            isSaving={isSaving}
            markdownContent={markdownContent}
            setMarkdownContent={setMarkdownContent}
            onSave={handleSaveChanges}
          />
        </div>
      </div>
    </div>
  );
}
