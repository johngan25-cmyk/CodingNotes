import React, { useState, useEffect } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css"; // Only the core styles, no extra theme CSS files
import api from "../services/axiosInstance.js";

const LogDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get("/api-logs");
        setLogs(data);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Could not connect to database logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleDeleteAll = async () => {
    try {
      await api.delete("/api-logs");
      // Clear the state locally so the UI updates instantly
      setLogs([]);
    } catch (err) {
      console.error("Error deleting logs:", err);
      alert("Could not clear database logs.");
    }
  };

  const handleRefresh = async () => {
    setLoading(true); // Show a brief loading state while fetching fresh data
    try {
      const response = await api.get("/api-logs");
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error("Error refreshing logs:", err);
      setError("Could not refresh database logs.");
    } finally {
      setLoading(false);
    }
  };
  const getMethodBadgeClass = (method) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "POST":
        return "bg-green-100 text-green-800 border-green-200";
      case "PUT":
      case "PATCH":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              System Request Logs
            </h1>
          </div>

          {/* Actions Group Container */}
          <div className="flex items-center gap-3">
            {/* 🔄 Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Logs
            </button>

            {/* 🗑️ Clear All Button */}
            <button
              onClick={handleDeleteAll}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200"
            >
              Clear All Logs
            </button>
          </div>
        </header>

        {loading && (
          <div className="p-10 text-center bg-white rounded-xl shadow-sm">
            Loading logs...
          </div>
        )}
        {error && (
          <div className="p-6 bg-red-50 text-red-700 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {/* Replace your <table> element structure with this modern Flexbox list */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header Row */}
                <div className="bg-slate-900 text-slate-200 text-xs font-semibold uppercase tracking-wider flex px-6 py-4">
                  <div className="w-28 shrink-0">Method</div>
                  <div className="grow px-4">Endpoint</div>
                  <div className="w-24 shrink-0 text-center">Status</div>
                  <div className="w-48 shrink-0 text-right">Logged At</div>
                </div>

                {/* Rows Container */}
                <div className="divide-y divide-slate-100 text-sm text-slate-700">
                  {logs.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400">
                      No logs found.
                    </div>
                  ) : (
                    logs.map((log) => (
                      /* Each log item is a vertical column wrapper containing the row details AND the full-width JSON block */
                      <div
                        key={log._id || log.id}
                        className="hover:bg-slate-50/80 transition-colors flex flex-col p-6"
                      >
                        {/* Top Row: Main Metadata */}
                        <div className="flex items-start w-full">
                          {/* Method */}
                          <div className="w-28 shrink-0">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold uppercase rounded border ${getMethodBadgeClass(log.method)}`}
                            >
                              {log.method}
                            </span>
                          </div>

                          {/* Endpoint */}
                          <div className="grow px-4 font-mono text-xs text-slate-600 break-all">
                            {log.endpoint ? decodeURIComponent(log.endpoint) : ""}
                          </div>

                          {/* Status */}
                          <div className="w-24 shrink-0 text-center font-bold">
                            <span
                              className={
                                log.statusCode >= 400
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }
                            >
                              {log.statusCode || "N/A"}
                            </span>
                          </div>

                          {/* Timestamp */}
                          <div className="w-48 shrink-0 text-slate-400 text-xs text-right">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>

                        {/* Bottom Row: Dynamic Document Details dropdown expanding to full width */}
                        <div className="mt-4 w-full">
                          <details className="group cursor-pointer w-full">
                            <summary className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 select-none list-none flex items-center gap-1">
                              <span>▶</span> View Full Document Data
                            </summary>

                            {/* This container sits outside columns, allowing it to dynamically span the full width of the parent flex block */}
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full h-auto">
                              <JsonView
                                src={{
                                  // Decodes nested query strings/params if they exist, otherwise maps the objects cleanly
                                  requestParams: log.requestParams
                                    ? JSON.parse(
                                        decodeURIComponent(
                                          JSON.stringify(log.requestParams),
                                        ),
                                      )
                                    : null,
                                  requestQuery: log.requestQuery
                                    ? JSON.parse(
                                        decodeURIComponent(
                                          JSON.stringify(log.requestQuery),
                                        ),
                                      )
                                    : null,
                                  requestBody: log.requestBody,
                                  response: log.response,
                                }}
                                displaySize={true}
                                enableClipboard={true}
                              />
                            </div>
                          </details>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogDashboard;
