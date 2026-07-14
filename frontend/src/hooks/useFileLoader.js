/*
  useFileLoader Custom Hook
  Coordinates the automated side effects tied to active document swapping. 
  Intercepts selection nodes to determine whether to serve markdown contents instantly 
  from local RAM state cache, build new boilerplate templates, or dispatch an async network query.
*/


import { useEffect } from "react";

export function useFileLoader({
  selectedNode,
  fileCache,
  setFileCache,
  setMarkdownContent,
  setUiState,
  fetchFileFromDatabase
}) {
  useEffect(() => {
    if (!selectedNode || selectedNode.isDirectory || selectedNode.name === "root") {
      setMarkdownContent(""); //setting md content
      return;
    }

    

    // Serving data instantly from memory cache if present
    if (fileCache[selectedNode.fullPath] !== undefined) {
      setMarkdownContent(fileCache[selectedNode.fullPath]);
      return;
    }
    
    // Fallback to async server dispatch
    fetchFileFromDatabase(false);
  }, [selectedNode, fileCache, fetchFileFromDatabase, setMarkdownContent, setUiState, setFileCache]);
}