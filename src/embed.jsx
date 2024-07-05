import debounce from "lodash.debounce"
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw"
import React from "react"
import { useAsyncEffect } from "@react-hook/async"

const onChange = debounce(
  (elements, appState, _files) => {
    const data = serializeAsJSON(elements, appState);
    window.callAmplenotePlugin("change", data);
  },
  1000,
  { maxWait: 10000 }
);

export default function Embed() {
  const { error, status, value } = useAsyncEffect(() => window.callAmplenotePlugin("load"), []);

  if (status === "loading") {
    return (<div>loading</div>);
  } else {
    return (
      <>
        <div style={ { height: "500px" } }>
          <Excalidraw
            initialData={ value }
            onChange={ onChange }
          />
        </div>
      </>
    );
  }
}
