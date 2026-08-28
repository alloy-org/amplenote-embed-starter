# Settings

|||
|-|-|
|**name**|**tldraw**|
|description|Sketch, diagram, and whiteboard on an infinite tldraw canvas, right inside your notes|
|icon|draw|
|instructions|Sketch, diagram, and whiteboard directly inside your notes with [tldraw](https://tldraw.dev/), an infinite canvas that lives in the note itself. Nothing leaves your account: the drawing is stored with the note, not on a third-party server.<br /><br /><mark>**Two ways to draw**</mark><br /><br />1. **Inline in a note (permanent).** Type the evaluation brackets `{tldraw}` in a note to drop a canvas in at the cursor. Whatever you draw is saved back into the note, so it is waiting for you the next time you open the note, on any device.<br />2. **Quick Open (scratch pad).** Press `Cmd-O` (`Ctrl-O` on Windows &amp; Linux) to bring up Quick Open, type "tldraw," and pick the plugin action to open a canvas in the Peek Viewer. A Peek Viewer drawing survives minimizing the window, but is discarded when you close it — handy for a quick sketch you do not intend to keep.<br /><br /><mark>**What you can put on the canvas**</mark><br /><br />1. **Freehand drawing**, with pressure sensitivity for stylus users, plus a highlighter and an eraser.<br />2. **Shapes, lines, and arrows** that snap to each other and stay attached when you move things around.<br />3. **Text and sticky notes**, for labeling a diagram or laying out ideas.<br />4. **Images**, pasted or dragged straight onto the canvas.<br />5. **Frames and multiple pages**, to keep a sprawling drawing organized.<br />6. **Styling** — color, fill, dash style, size, and font — from the style panel beside the toolbar.<br /><br />The usual tldraw shortcuts apply: `V` to select, `D` to draw, `E` to erase, `T` for text, `N` for a sticky note, and `Cmd-Z` to undo. The canvas is infinite — scroll or pinch to pan, and hold `Cmd` while scrolling to zoom.<br /><br /><mark>**Saving**</mark>: edits save automatically about a second after you stop drawing. A small "saving…" indicator sits at the bottom of the canvas while a save is in flight; let it disappear before navigating away from a big change.<br /><br /><mark>**Limitations**</mark>: the drawing is stored as data alongside the embed rather than as a picture, which means a very large or very detailed drawing can run into size limits, and the canvas will not render in a published (public) note. In either case, use tldraw's menu in the top-left corner → **Export as** → **PNG** or **SVG** to place a flat image in the note instead.|
\

The source code that is built into the `build.html.json` file below can be [found at GitHub](https://github.com/alloy-org/amplenote-embed-starter/tree/tldraw).

\

# Code

```javascript
({
  async appOption(app) {
    await app.openEmbed();
    await app.navigate("https://www.amplenote.com/notes/plugins/" + app.context.pluginUUID);
  },

  async insertText(app) {
    await app.context.replaceSelection(`<object data="plugin://${ app.context.pluginUUID }" data-aspect-ratio="1" />`);
    return null;
  },

  async onEmbedCall(app, type, data) {
    if (type === "load") {
      const args = app.context.embedArgs;
      if (args.length !== 1) return null

      return atob(args[0]);
    } else if (type === "change") {
      const encodedData = btoa(data);
      app.context.updateEmbedArgs(encodedData);
      return true;
    }
  },

  async renderEmbed(app) {
    if (app.context.setEmbedHTML) {
      app.context.setEmbedHTML(`
        <div style="animation: amplenote-embed-spin 0.8s linear infinite; border: 3px solid rgba(133, 147, 163, 0.25); border-top-color: #8593A3; border-radius: 50%; box-sizing: border-box; height: 36px; width: 36px; position: fixed; top: 50%; left: 50%; margin: -18px 0 0 -18px;"></div>
        <style>@keyframes amplenote-embed-spin { to { transform: rotate(360deg); } }</style>
      `);
    }

    try {
      const attachments = await app.getNoteAttachments(app.context.pluginUUID);
      const attachment = attachments.find(attachment => attachment.name === "build.html.json");
      if (!attachment) throw new Error("build.html.json attachment not found");
      return this._getAttachmentContent(app, attachment.uuid);
    } catch (error) {
      return `<div><em>renderEmbed error:</em> ${ error.toString() }</div>`;
    }
  },

  async _getAttachmentContent(app, attachmentUUID) {
    const url = await app.getAttachmentURL(attachmentUUID);

    const proxyURL = new URL("https://plugins.amplenote.com/cors-proxy");
    proxyURL.searchParams.set("apiurl", url);

    const response = await fetch(proxyURL);
    return response.text();
  }
})
```

\

[build.html.json](./build.html.json)

\
