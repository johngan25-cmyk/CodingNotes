/*
  useTreeSync Custom Hook
  Handles local directory clones and syncs them directly with the server using Axios. 
  Isolates directory management side effects from the file rendering panels.
*/


import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from '../services/axiosInstance.js'

export function useTreeSync(activeDisplayTree, onSelect) {
  const [localTree, setLocalTree] = useState(null);

  // Keep internal structure mirrored with workspace changes
  useEffect(() => {
    if (activeDisplayTree) {
      setLocalTree(JSON.parse(JSON.stringify(activeDisplayTree)));
    }
  }, [activeDisplayTree]);

  // Unified pipeline leveraging Axios
  const pushTreeSnapshotToServer = useCallback(async (updatedTreeObject, optionalNewSelectNode = null) => {
    try {
      await api.post("/sync-directory", { modifiedTreeData: updatedTreeObject });
      setLocalTree(updatedTreeObject);
      if (optionalNewSelectNode !== undefined) {
        onSelect(optionalNewSelectNode);
      }
      return updatedTreeObject;
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sync tree changes to the server.");
      throw err;
    }
  }, [onSelect]);

  return { localTree, pushTreeSnapshotToServer };
}