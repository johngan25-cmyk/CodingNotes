import React, { useState, useEffect } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import MarkdownWorkspace from "./MarkdownWorkspace";
import HtmlWorkspace from "./HtmlWorkspace";

export default function ContentPreviewPanel({
  selectedNode,
  markdownContent,
  onSave,
  isSaving,
}) {
  const [localContent, setLocalContent] = useState("");

  useEffect(() => {
    setLocalContent(markdownContent || "");
  }, [selectedNode, markdownContent]);

  // Normalizes line breaks and whitespace signatures
  const normalizeMarkdown = (text) =>
    (text || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trimEnd();

  const isModified =
    normalizeMarkdown(localContent) !== normalizeMarkdown(markdownContent);

  // Empty State Fallback
  if (!selectedNode || selectedNode.isDirectory) {
    return (
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-8 text-slate-400 font-medium text-sm shadow-xs select-none">
        Select a note file from the explorer sidebar to begin tracking content updates.
      </div>
    );
  }

  const isMarkdown = selectedNode.name.endsWith(".md");
  const isHtml = selectedNode.name.endsWith(".html");
  const isTxt = selectedNode.name.endsWith(".txt");

  // 🚀 Helper to test if text data is strictly a standalone URL link string
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;
  const isPureLink = isTxt && urlRegex.test(localContent.trim());

  return (
    <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs">
      
      {/* 🧭 HEADER ACTION CONTROL STRIP */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {isModified && !isPureLink && (
            <button
              onClick={() => onSave(localContent)}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-2xs"
            >
              {isSaving ? "Saving..." : "💾 Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* DUAL WORKSPACE ENGINES SWITCH ROUTER */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden">
        {isPureLink ? (
          /* 🚀 CASE 0: PURE LINK TXT FILE VIEWPORT */
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/30 p-8 text-center animate-fade-in">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-3 shadow-2xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Shortcut Link Detected</h3>
            <p className="text-xs text-slate-500 max-w-xs break-all mb-4  underline bg-slate-100/80 px-2 py-1 rounded">
              {localContent.trim()}
            </p>
            <a
              href={localContent.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer shadow-xs transition-all hover:-translate-y-0.5"
            >
              <span>Open Link in New Tab</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
            </a>
          </div>
        ) : isMarkdown ? (
          <MarkdownWorkspace 
            localContent={localContent} 
            setLocalContent={setLocalContent} 
          />
        ) : isHtml ? (
          <HtmlWorkspace content={localContent} />
        ) : (
          /* Plain-Text Fallback Editor View (Handles ordinary .txt configurations) */
          <div className="w-full h-full p-3 bg-slate-50/10">
            <CodeMirror
              value={localContent}
              height="100%"
              theme={oneDark}
              extensions={[EditorView.lineWrapping]}
              onChange={(val) => setLocalContent(val)}
              className="text-sm font-sans h-full border border-slate-200 rounded-lg overflow-hidden shadow-2xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}