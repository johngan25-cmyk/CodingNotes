/*
  useDirectorySync Custom Hook
  Isolates the initial application lifecycle side effect. Runs once on application mount 
  to fetch the remote filesystem configuration snapshot from the API and bootstrap 
  the base visibility tree map.
*/


import { useEffect } from "react";
import api from "../services/axiosInstance.js";

export function useDirectorySync(setTreeData, setOpenFolders, triggerToast) {
  useEffect(() => {
    api.get("/sync-directory")
      .then((response) => {
        const data = response.data;
        setTreeData(data);
        if (data?.fullPath) setOpenFolders({ [data.fullPath]: true });
      })
      .catch((err) => triggerToast("error", err.response?.data?.message || err.message));
  }, [setTreeData, setOpenFolders, triggerToast]);
}