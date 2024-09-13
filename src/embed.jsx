import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw"
import debounce from "lodash.debounce"
import React, { useMemo, useRef, useState } from "react"
import { useAsyncEffect } from "@react-hook/async"

function useOnChange(setIsSaving) {
  // So we can keep track of overlapping pending saves to know when there is no pending save remaining
  const saveCounterRef = useRef(1);

  // Excalidraw will call onChange when the mouse moves, which is not something we care to persist - only when the
  // data actually changes, as persistence requires calling into the plugin and updating the note.
  const lastDataRef = useRef(null);

  return useMemo(
    () => {
      const save = debounce(
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
      );

      return (elements, appState, _files) => {
        const data = serializeAsJSON(elements, appState);

        // After initial load, Excalidraw will call onChange
        if (lastDataRef.current === null) {
          lastDataRef.current = data;
          return;
        }

        if (data === lastDataRef.current) return;
        lastDataRef.current = data;

        setIsSaving(true);
        saveCounterRef.current += 1;
        save(data, saveCounterRef.current);
      };
    },
    []
  );
}

export default function Embed() {
  const [ isSaving, setIsSaving ] = useState(false);

  const { status, value: initialData } = useAsyncEffect(
    async () => {
      const data = await window.callAmplenotePlugin("load");
      return data ? JSON.parse(data) : null;
    },
    []
  );

  const onChange = useOnChange(setIsSaving);

  if (status === "loading") {
    return (<div>loading</div>);
  } else {
    return (
      <>
        <div className="container">
          <Excalidraw
            initialData={ initialData }
            onChange={ onChange }
          />
          {
            isSaving
              ? (
                <div className="saving-message">
                  saving...
                </div>
              )
              : null
          }
        </div>
      </>
    );
  }
}
