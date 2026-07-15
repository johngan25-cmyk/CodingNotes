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
  const defaultText = `# hello`;
  useEffect(() => {
    if (!selectedNode || selectedNode.isDirectory || selectedNode.name === "root") {
      setMarkdownContent(""); //setting md content
      return;
    }

    // 🔥 ADD THIS NEW BLOCK: Skip text loading if the node is a web link
    if (selectedNode.isLink) {
      setMarkdownContent(""); 
      return;
    }

    // Serving data instantly from memory cache if present
    if (fileCache[selectedNode.fullPath] !== undefined) {
      setMarkdownContent(fileCache[selectedNode.fullPath]);
      return;
    }
    
    //if just created no need to fetch from db..show default
    if(selectedNode.isNewUnsaved==true){
      setMarkdownContent(defaultText);
      return;
    }

    //try to get it from db
    fetchFileFromDatabase(false);
    
  }, [selectedNode, fileCache, fetchFileFromDatabase, setMarkdownContent, setUiState, setFileCache]);
}