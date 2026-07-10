# Settings

|||
|-|-|
|name|tldraw|
|description|Draw content in a note.|
|icon|draw|
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
    await app.context.replaceSelection(`<object data="plugin://${ app.context.pluginUUID }" data-aspect-ratio="2" />`);
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
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
          <div style="width: 32px; height: 32px; border: 3px solid rgba(128, 128, 128, 0.3); border-top-color: rgba(128, 128, 128, 0.9); border-radius: 50%; animation: amplenote-embed-spin 0.8s linear infinite;"></div>
          <style>@keyframes amplenote-embed-spin { to { transform: rotate(360deg); } }</style>
        </div>
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
