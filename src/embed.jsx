import debounce from "lodash.debounce"
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw"
import React from "react"

const onChange = debounce(
  (elements, appState, _files) => {
    const data = serializeAsJSON(elements, appState);
    window.callAmplenotePlugin("change", data);
  },
  1000,
  { maxWait: 10000 }
);

export default function Embed() {
  return (
    <>
      <h1>Hello, Excalidraw!</h1>
      <div style={ { height: "500px" } }>
        <Excalidraw
          onChange={ onChange }
        />
      </div>
    </>
  );
}
