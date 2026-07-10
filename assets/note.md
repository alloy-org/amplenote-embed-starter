# Settings

|||
|-|-|
|name|tldraw|
|description|Draw content in a note.|
|icon|draw|
|instructions|You can invoke tldraw in two ways: You can use the evaluation brackets `{tldraw}` to insert a tldraw canvas inline in your note. This will be persisted (saved) if you leave the note and return to it.<br /><br />You can also use Cmd-O to invoke Quick Open, and enter "tldraw" to choose the plugin action, which will open a tldraw window in the Peek Viewer. Drawings made in Peek Viewer will be kept if you minimize the Peek Viewer window, but will be deleted when you close the tldraw Peek Viewer window, so it's a less permanent drawing compared to entering `{tldraw}`.<br /><br />tldraw drawings are currently saved in the URL of the iframe. This may cause issues if very large drawings are created. You can always export your drawing to an image within tldraw, which has the side benefit that the image will show in a public note.|
\

The source code that is built into the `build.html.json` file below can be [found at GitHub](https://github.com/alloy-org/amplenote-embed-starter/tree/tldraw).

\

# Code

```javascript
({
  appOption(app) {
    app.openSidebarEmbed(1);
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
