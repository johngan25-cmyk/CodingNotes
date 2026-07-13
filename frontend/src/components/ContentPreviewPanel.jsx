import React, { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as cmMarkdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@uiw/react-codemirror";
// Unified Crepe engine + styling layers
import { Crepe } from "@milkdown/crepe";
import { replaceAll, getMarkdown } from "@milkdown/kit/utils";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { Group, Panel, Separator } from "react-resizable-panels";
// =========================================================================
// 🌐 VISUAL WYSIWYG PREVIEW (Crepe)
// =========================================================================
function VisualEditorCanvas({ value, onChange }) {
  const containerRef = useRef(null);
  const crepeRef = useRef(null);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const internalLockRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: containerRef.current,
      defaultValue: valueRef.current,
    });

    crepeRef.current = crepe;

    crepe
      .create()
      .then(() => {
        crepe.on((listener) => {
          listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (!crepe.editor) return;
            if (markdown === prevMarkdown) return;
            if (markdown === valueRef.current) return;
            if (internalLockRef.current) return;

            onChangeRef.current(markdown);
          });
        });
      })
      .catch((err) => console.error("Failed to initialize Crepe:", err));

    return () => {
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy();
        } catch (e) {}
        crepeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const crepe = crepeRef.current;
    if (!crepe || !crepe.editor) return;

    try {
      const currentMarkdown = crepe.editor.action(getMarkdown());
      if (currentMarkdown !== value) {
        internalLockRef.current = true;
        crepe.editor.action(replaceAll(value));
        internalLockRef.current = false;
      }
    } catch (e) {
      internalLockRef.current = false;
    }
  }, [value]);

  return <div ref={containerRef} className="h-full w-full" />;
}

// =========================================================================
// 🚀 MAIN WORKSPACE PREVIEW PANEL
// =========================================================================
export default function ContentPreviewPanel({
  selectedNode,
  markdownContent,
  setMarkdownContent,
  onSave,
  isSaving,
}) {
  const [localContent, setLocalContent] = useState("");
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    setLocalContent(markdownContent || "");
    setHasEdited(false);
  }, [selectedNode, markdownContent]);

  const isModified =
    hasEdited &&
    localContent.replace(/\r\n/g, "\n") !==
      (markdownContent || "").replace(/\r\n/g, "\n");

  if (!selectedNode || selectedNode.isDirectory) {
    return (
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-8 text-slate-400 font-medium text-sm shadow-xs select-none">
        Select a note file from the explorer sidebar to begin tracking content
        updates.
      </div>
    );
  }

  const handlemarkdownchange = async () => {
    await onSave(localContent);
    setHasEdited(false);
  };

  const isMarkdown = selectedNode.name.endsWith(".md");
  const isHtml = selectedNode.name.endsWith(".html");

  return (
    <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs">
      {/* 🧭 HEADER ACTION CONTROL STRIP */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {isModified && (
            <button
              onClick={handlemarkdownchange}
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
        {isMarkdown ? (
          /* CASE 1: 🛠️ MARKDOWN DRAGGABLE RESIZABLE PANELS WORKSPACE */
          <Group direction="horizontal" className="w-full h-full">
            {/* LEFT PANEL: CodeMirror Advanced Source Editor */}
            <Panel
              defaultSize={50}
              minSize={20}
              className="h-full flex flex-col p-2 overflow-hidden bg-slate-50/10"
            >
              <div className="w-full flex-1 min-h-0 overflow-y-auto rounded-lg border border-slate-200/80 shadow-2xs bg-[#282c34]">
                <CodeMirror
                  value={localContent}
                  height="100%"
                  theme={oneDark}
                  extensions={[cmMarkdown(), EditorView.lineWrapping]}
                  onChange={(val) => {
                    setLocalContent(val);
                    setHasEdited(true);
                  }}
                  className="text-sm font-mono h-full outline-hidden"
                />
              </div>
            </Panel>

            {/* 🔥 THE ACTIVE RESIZABLE SLIDING HANDLE EDGE */}
            <Separator className="w-1.5 bg-slate-200/60 hover:bg-slate-400 active:bg-slate-500 cursor-col-resize transition-colors duration-150 relative z-10 mx-0.5 rounded-full" />

            {/* RIGHT PANEL: Crepe Rich-Text Rendering Canvas */}
            <Panel
              defaultSize={50}
              minSize={20}
              className="h-full flex flex-col p-2 overflow-hidden bg-slate-50/20"
            >
              <div className="w-full flex-1 min-h-0 overflow-y-auto bg-white rounded-lg p-2 border border-slate-200/80 shadow-2xs max-w-none milkdown-crepe-panel">
                <VisualEditorCanvas
                  value={localContent}
                  onChange={(val) => {
                    setLocalContent(val);
                    setHasEdited(true);
                  }}
                />
              </div>
            </Panel>
          </Group>
        ) : isHtml ? (
          /* CASE 2: HTML FULL PREVIEW DISPLAY RENDER (Full Layout Fill) */
          <div className="w-full h-full p-2 bg-slate-50/20 flex flex-col overflow-hidden">
            <div className="w-full flex-1 min-h-0 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
              <iframe
                srcDoc={localContent}
                title="HTML Canvas Workspace Preview Rendering Sandbox"
                sandbox="allow-scripts"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        ) : (
          /* CASE 3: PLAIN TEXT FALLBACK CODE EDITOR PANE */
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
