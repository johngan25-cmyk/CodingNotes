/*
  useWorkspace Hook (Core State Orchestrator)
  The central brain state-machine of the application layer. Manages structural states, 
  memory lookups, loading spinners, and houses patch mutations to persist local edits.
  Consumes sub-hooks to offload declarative effects, presenting a clean api interface to App.jsx.
*/


import { useState, useCallback, useRef} from "react";
import axios from "axios";
import { useDirectorySync } from "./useDirectorySync";
import { useFileLoader } from "./useFileLoader";
import api from "../services/axiosInstance.js";

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

  // 🛡️ A persistent mutable reference to keep track of the active timer
  const toastTimerRef = useRef(null);
  const triggerToast = useCallback((type, message) => {
    // 1. Immediately kill any existing active countdown timer to prevent collisions
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    // 2. Safely apply the new message state
    setUiState({
      error: type === "error" ? message : "",
      success: type === "success" ? message : "",
    });
    // 3. Start a fresh, un-interrupted countdown (5 seconds is standard readability)
    toastTimerRef.current = setTimeout(() => {
      setUiState({ error: "", success: "" });
      toastTimerRef.current = null;
    }, 3000);
  }, []);


  //fetching file from database
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

  // 🚀 Hook Registration: Side-effects run out of sight!
  useDirectorySync(setTreeData, setOpenFolders, triggerToast);
  
  useFileLoader({
    selectedNode,
    fileCache,
    setFileCache,
    setMarkdownContent,
    setUiState,
    fetchFileFromDatabase
  });

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
  };
}