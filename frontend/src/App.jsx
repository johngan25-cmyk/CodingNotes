import SidebarExplorer from "./components/SidebarExplorer";
import ContentPreviewPanel from "./components/ContentPreviewPanel";
import ToastBanner from "./components/ToastBanner";
import WorkspaceHeader from "./components/WorkspaceHeader";
import { useWorkspace } from "./hooks/useWorkspace";

export default function App() {
  const {
    treeData,
    focusedNode,
    setFocusedNode,
    selectedNode,
    setSelectedNode,
    markdownContent,
    setMarkdownContent,
    isLoadingContent,
    isSaving,
    openFolders,
    setOpenFolders,
    uiState,
    isSidebarOpen,
    setIsSidebarOpen,
    fetchFileFromDatabase,
    handleSaveChanges,
    handleManualRefresh
  } = useWorkspace();

  return (
    <div className="w-screen h-screen bg-slate-50 text-slate-800 px-6 py-4 flex flex-col overflow-hidden relative">
      <ToastBanner error={uiState.error} success={uiState.success} />
      
      <WorkspaceHeader 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedNode={selectedNode}
        isLoadingContent={isLoadingContent}
        onRefresh={handleManualRefresh}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0 pb-2">
        {/* Sidebar Panel Column Wrapper */}
        <div className={`min-h-0 ${isSidebarOpen ? "md:col-span-1 flex flex-col" : "hidden"}`}>
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

        {/* Dynamic Canvas Workspace Column Wrapper */}
        <div className={`min-h-0 flex flex-col ${isSidebarOpen ? "md:col-span-3" : "md:col-span-4"}`}>
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