import { Folder, Loader2, FileText, Save } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ExternalLink } from "lucide-react";
export default function ContentPreviewPanel({
  selectedNode,
  isLoadingContent,
  isEditing,
  setIsEditing,
  isSaving,
  markdownContent,
  setMarkdownContent,
  onSave,
}) {
  if (!selectedNode) {
    return (
      <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[650px] p-6 justify-center items-center text-center">
        <Folder
          size={40}
          className="mx-auto mb-2 opacity-30 stroke-1 text-slate-400"
        />
        <p className="text-sm text-slate-400">
          Select a note from the explorer workspace to view or modify its
          contents.
        </p>
      </main>
    );
  }

  const fileExtension = selectedNode.name?.split(".").pop()?.toLowerCase();
  const highlightLanguage = fileExtension === "html" ? "html" : "markdown";
  const isEditableType = ["md", "markdown", "txt"].includes(fileExtension);

  return (
    <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full min-h-0">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={16} className="text-blue-500 shrink-0" />
          <span className="font-semibold text-slate-900 text-sm truncate">
            {selectedNode.name}
          </span>
        </div>

        {isEditableType && !isLoadingContent && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-medium px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded transition-colors cursor-pointer"
            >
              {isEditing ? "Cancel Edit" : "Edit File"}
            </button>
            {isEditing && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                <span>Save</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white min-h-0 relative flex flex-col">
        {isLoadingContent ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className="text-xs">Fetching file contents...</p>
          </div>
        ) : selectedNode.isDirectory || selectedNode.name === "root" ? (
          <div className="m-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-xs font-medium">
            Folder Node Selected. Open nested items in the explorer panel to
            inspect content.
          </div>
        ) : highlightLanguage === "html" ? (
          <iframe
            title="HTML Note Preview"
            srcDoc={markdownContent}
            sandbox="allow-scripts"
            className="w-full h-full border-0 absolute inset-0"
          />
        ) : /* 🔥 NEW CHECK: Detect if the file text is just a single standalone URL link */
          !isEditing && /^https?:\/\/[^\s]+$/.test(markdownContent.trim()) ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-4 p-6 bg-slate-50/30">
            <div className="text-center max-w-md">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                Resource Link File
              </p>
              <p className="text-sm font-semibold text-slate-700 truncate mb-4">
                {markdownContent.trim()}
              </p>
              <a
                href={markdownContent.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <span>Open Link in New Tab</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : isEditing ? (
          <textarea
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            className="w-full h-full p-6 font-mono text-xs focus:outline-none resize-none flex-1 leading-relaxed border-0"
            placeholder="Start editing..."
          />
        ) : (
          <div className="flex-1 overflow-auto font-mono text-xs bg-white">
            <SyntaxHighlighter
              language="markdown"
              style={oneLight}
              wrapLines={true}
              wrapLongLines={true}
              customStyle={{
                margin: 0,
                padding: "1.5rem",
                background: "#ffffff",
                fontSize: "0.8rem",
                lineHeight: "1.6",
                height: "100%",
                width: "100%",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowX: "hidden",
              }}
              codeTagProps={{
                style: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
              }}
            >
              {markdownContent}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </main>
  );
}
