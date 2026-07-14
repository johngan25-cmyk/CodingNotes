/*
  VisualEditorCanvas Component
  Encapsulates the configuration, generation, and cleanup lifecycle of the 
  Milkdown Crepe WYSIWYG rich-text engine. Synchronizes changes bidirectionally 
  with structural states using mutual atomic internal reference locks to prevent infinite update loops.
*/

import React, { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { replaceAll, getMarkdown } from "@milkdown/kit/utils";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default function VisualEditorCanvas({ value, onChange }) {
  const containerRef = useRef(null);
  const crepeRef = useRef(null);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const internalLockRef = useRef(false);
  const initializedRef = useRef(false);

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
        initializedRef.current = true;
        // 🚀 Inject the initial value immediately after the editor finishes loading
       if (valueRef.current && crepe.editor) {
         internalLockRef.current = true;
         crepe.editor.action(replaceAll(valueRef.current));
         internalLockRef.current = false;
       }
        crepe.on((listener) => {
          listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (!initializedRef.current || !crepe.editor) return;
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

  return <div ref={containerRef} spellCheck={false} className="h-full w-full" />;
}