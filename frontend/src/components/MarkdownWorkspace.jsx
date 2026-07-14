/*
  MarkdownWorkspace Component
  Generates the side-by-side advanced markdown workspace split-pane layout. 
  Integrates an elastic sliding slider separator to handle draggable horizontal layout rescaling 
  between the raw CodeMirror syntax viewport and the Crepe rendered preview canvas.
*/

import React from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { markdown as cmMarkdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { Group, Panel, Separator } from "react-resizable-panels";
import VisualEditorCanvas from "./VisualEditorCanvas";

export default function MarkdownWorkspace({ localContent, setLocalContent }) {
  return (
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
            onChange={(val) => setLocalContent(val)}
            className="text-sm font-mono h-full outline-hidden"
          />
        </div>
      </Panel>

      {/* THE ACTIVE RESIZABLE SLIDING HANDLE EDGE */}
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
            onChange={(val) => setLocalContent(val)}
          />
        </div>
      </Panel>
    </Group>
  );
}