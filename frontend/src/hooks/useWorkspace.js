/*
  useWorkspace Hook (Core State Orchestrator)
  The central brain state-machine of the application layer. Manages structural states, 
  memory lookups, loading spinners, and houses patch mutations to persist local edits.
  Consumes sub-hooks to offload declarative effects, presenting a clean api interface to App.jsx.
*/
import { useState, useCallback, useRef } from "react";
import { useDirectorySync } from "./useDirectorySync";
import { useFileLoader } from "./useFileLoader";
import api from "../services/axiosInstance.js";

// Helper to check if a folder still exists in the incoming tree
const verifyPathExists = (node, targetPath) => {
  if (!node) return false;
  if (node.fullPath === targetPath) return true;
  if (node.children) {
    for (let child of node.children) {
      if (verifyPathExists(child, targetPath)) return true;
    }
  }
  return false;
};

export function useWorkspace() {
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

  // Persistent Toast Ref
  const toastTimerRef = useRef(null);
  const triggerToast = useCallback((type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setUiState({
      error: type === "error" ? message : "",
      success: type === "success" ? message : "",
    });
    toastTimerRef.current = setTimeout(() => {
      setUiState({ error: "", success: "" });
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  // 1. Fetching File Content
  const fetchFileFromDatabase = useCallback(async (isManualRefresh = false) => {
    if (!selectedNode?.fullPath) return;
    setIsLoadingContent(true);
    try {
      const response = await api.get("/content", { params: { path: selectedNode.fullPath } });
      const text = response.data.textData || "";
      setMarkdownContent(text);
      setFileCache((prev) => ({ ...prev, [selectedNode.fullPath]: text }));
      if (isManualRefresh) triggerToast("success", "Fresh content loaded!");
    } catch (err) {
      triggerToast("error", err.response?.data?.message || err.message);
    } finally {
      setIsLoadingContent(false);
    }
  }, [selectedNode, triggerToast]);

  // 2. Smart Directory Syncing (Shared between Initial Load and Manual Refresh)
  const syncDirectoryData = useCallback(async (isManualRefresh = false) => {
    try {
      const response = await api.get("/sync-directory");
      const freshTreeData = response.data;
      
      setTreeData(freshTreeData);

      // Evaluate states to preserve folder layout
      setOpenFolders((prevOpenFolders) => {
        const nextOpenFolders = {};
        
        Object.keys(prevOpenFolders).forEach((path) => {
          if (prevOpenFolders[path]) {
            // Keep it open if it exists, drop it if it was deleted
            if (verifyPathExists(freshTreeData, path)) {
              nextOpenFolders[path] = true;
            }
          }
        });

        // Ensure the root folder stays expanded on boot
        if (freshTreeData?.fullPath) {
          nextOpenFolders[freshTreeData.fullPath] = true;
        }

        return nextOpenFolders;
      });

      if (isManualRefresh) triggerToast("success", "Directory structure updated!");
    } catch (err) {
      triggerToast("error", err.response?.data?.message || "Failed to sync directory");
      throw err;
    }
  }, [triggerToast]);

  // 🚀 Hook Registration: Bootstraps the app seamlessly via the new function!
  useDirectorySync(syncDirectoryData);
  
  useFileLoader({
    selectedNode,
    fileCache,
    setFileCache,
    setMarkdownContent,
    setUiState,
    fetchFileFromDatabase
  });

  // 3. Central Refresh Button Handler
  const handleManualRefresh = useCallback(async () => {
    setIsLoadingContent(true);
    try {
      await Promise.all([
        fetchFileFromDatabase(false),
        syncDirectoryData(false)
      ]);
      triggerToast("success", "Workspace synchronized successfully!");
    } catch (err) {
      // Handled by sub-methods
    } finally {
      setIsLoadingContent(false);
    }
  }, [fetchFileFromDatabase, syncDirectoryData, triggerToast]);

  const handleSaveChanges = async (content) => {
    setIsSaving(true);
    try {
      await api.patch("/update-file-content", {
        currentPath: selectedNode.fullPath,
        updates: { textData: content }
      });
      setFileCache((prev) => ({ ...prev, [selectedNode.fullPath]: content }));
      setMarkdownContent(content);
      triggerToast("success", "Changes saved safely!");
    } catch (err) {
      triggerToast("error", err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this inside useWorkspace.js, right next to your handleSaveChanges function
  const handleUpdateLink = async (newUrl) => {
    if (!selectedNode?.fullPath) return;
    
    try {
      // Hit your new PATCH endpoint
      await api.patch("/update-link", {
        resourcePath: selectedNode.fullPath,
        destinationUrl: newUrl
      });
      
      // Update the local tree state immediately so the UI reflects the change
      const updateTreeRecursively = (nodes) => {
        return nodes.map(node => {
          if (node.fullPath === selectedNode.fullPath) {
            return { ...node, destinationUrl: newUrl };
          }
          if (node.children) {
            return { ...node, children: updateTreeRecursively(node.children) };
          }
          return node;
        });
      };

      setTreeData(prevTree => {
        if (!prevTree) return prevTree;
        // If root itself was somehow a link (unlikely, but safe to check)
        if (prevTree.fullPath === selectedNode.fullPath) {
           return { ...prevTree, destinationUrl: newUrl };
        }
        return { ...prevTree, children: updateTreeRecursively(prevTree.children || []) };
      });
      
      // Also update the currently selected node to force the preview panel to re-render
      setSelectedNode(prev => ({ ...prev, destinationUrl: newUrl }));
      
      triggerToast("success", "Link destination updated!");
    } catch (err) {
      triggerToast("error", err.response?.data?.message || "Failed to update link");
    }
  };

  return {
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
    handleManualRefresh, // Expose this clean pipeline out to App.jsx!
    handleUpdateLink
  };
}