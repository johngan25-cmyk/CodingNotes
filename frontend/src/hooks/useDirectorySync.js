/*
  useDirectorySync Custom Hook
  Isolates the initial application lifecycle side effect. Runs once on application mount 
  to fetch the remote filesystem configuration snapshot from the API and bootstrap 
  the base visibility tree map.
*/


import { useEffect } from "react";

export function useDirectorySync(syncDirectoryData) {
  useEffect(() => {
    // Bootstrap the app by pulling the initial directory layout
    syncDirectoryData(false);
  }, [syncDirectoryData]);
}