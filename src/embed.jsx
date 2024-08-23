import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw"
import debounce from "lodash.debounce"
import React, { useMemo, useRef, useState } from "react"
import { useAsyncEffect } from "@react-hook/async"

export default function Embed() {
  const [ isSaving, setIsSaving ] = useState(false);

  const { error, status, value } = useAsyncEffect(
    async () => {
      const data = await window.callAmplenotePlugin("load");
      return data ? JSON.parse(data) : null;
    },
    []
  );

  const saveCounterRef = useRef(1);

  const onChange = useMemo(
    () => {
      const save = debounce(
        (elements, appState, _files, expectedSaveCounter) => {
          const data = serializeAsJSON(elements, appState);

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
        setIsSaving(true);
        saveCounterRef.current += 1;
        save(elements, appState, _files, saveCounterRef.current);
      };
    },
    []
  )

  if (status === "loading") {
    return (<div>loading</div>);
  } else {
    return (
      <>
        <div className="container">
          <Excalidraw
            initialData={ value }
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
