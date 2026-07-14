import React from "react";

export default function HtmlWorkspace({ content }) {
  return (
    <div className="w-full h-full p-2 bg-slate-50/20 flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <iframe
          srcDoc={content}
          title="HTML Canvas Workspace Preview Rendering Sandbox"
          sandbox="allow-scripts"
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  );
}