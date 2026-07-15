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
  onUpdateLink
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

  // 🚀 Helper to test if text data is strictly a standalone URL link string
  // Clean, direct check using our new node property
  const isPureLink = selectedNode?.isLink;
  const displayUrl = selectedNode?.destinationUrl || "";
const safeHref = displayUrl.match(/^https?:\/\//i) ? displayUrl : `https://${displayUrl}`;
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
              {displayUrl.trim()}
            </p>
            
            {/* 🔥 ADD THIS WRAPPER DIV so they sit side-by-side */}
            <div className="flex items-center justify-center gap-3">
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer shadow-xs transition-all hover:-translate-y-0.5"
              >
                <span>Open Link in New Tab</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
              </a>

              {/* 🔥 NEW EDIT BUTTON */}
              <button
                onClick={() => {
                  // Prompt the user, pre-filling their current URL!
                  const newUrl = prompt("Update Destination URL:", displayUrl);
                  
                  // Only fire the network request if they typed something new
                  if (newUrl && newUrl !== displayUrl && onUpdateLink) {
                    onUpdateLink(newUrl);
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs px-4 py-2 rounded-lg cursor-pointer shadow-xs transition-all hover:-translate-y-0.5"
              >
                <span>Edit Link</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            </div> {/* <-- Close the wrapper div here */}
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