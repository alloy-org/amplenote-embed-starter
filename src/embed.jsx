import React from "react"
import { Excalidraw } from "@excalidraw/excalidraw"

export default function Embed() {
  return (
    <>
      <h1>Hello, Excalidraw!</h1>
      <div style={ { height: "500px" } }>
        <Excalidraw />
      </div>
    </>
  );
}
