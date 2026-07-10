import debounce from "lodash.debounce"
import React, { useCallback, useMemo, useRef, useState } from "react"
import { useAsyncEffect } from "@react-hook/async"
import { Tldraw, getSnapshot, loadSnapshot } from "tldraw"

import "tldraw/tldraw.css"
import "./embed.css"

// --------------------------------------------------------------------------
function useOnMount(setIsSaving) {
  // So we can keep track of overlapping pending saves to know when there is no pending save remaining
  const saveCounterRef = useRef(1);

  // The store listener can fire without the document actually changing (e.g. selection tweaks that still
  // count as document-scoped). Only persist when the serialized snapshot actually changes, as persistence
  // requires calling into the plugin and updating the note.
  const lastDataRef = useRef(null);

  const save = useMemo(
    () => debounce(
      (data, expectedSaveCounter) => {
        (async () => {
          try {
            await window.callAmplenotePlugin("change", data);
          } finally {
            if (saveCounterRef.current === expectedSaveCounter) {
              setIsSaving(false);
            }
          }
        })();
      },
      1000,
      { maxWait: 5000 }
    ),
    [ setIsSaving ]
  );

  return useCallback(
    (editor, initialSnapshot) => {
      // Load any previously-saved drawing. Because we only listen for changes with `source: "user"` below,
      // this programmatic load will not trigger a save.
      if (initialSnapshot) {
        loadSnapshot(editor.store, { document: initialSnapshot });
      }

      editor.store.listen(
        () => {
          const { document } = getSnapshot(editor.store);
          const data = JSON.stringify(document);

          if (data === lastDataRef.current) return;
          lastDataRef.current = data;

          setIsSaving(true);
          saveCounterRef.current += 1;
          save(data, saveCounterRef.current);
        },
        { scope: "document", source: "user" }
      );
    },
    [ save, setIsSaving ]
  );
}

// --------------------------------------------------------------------------
export default function Embed() {
  const [ isSaving, setIsSaving ] = useState(false);

  const { status, value: initialSnapshot } = useAsyncEffect(
    async () => {
      const data = await window.callAmplenotePlugin("load");
      return data ? JSON.parse(data) : null;
    },
    []
  );

  const onMount = useOnMount(setIsSaving);

  if (status === "loading") {
    return (<div className="loading-spinner" />);
  } else {
    return (
      <div className="container">
        <Tldraw onMount={ editor => onMount(editor, initialSnapshot) } />
        {
          isSaving
            ? (<div className="saving-message">saving...</div>)
            : null
        }
      </div>
    );
  }
}
