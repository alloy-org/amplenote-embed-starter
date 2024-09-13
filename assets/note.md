# Settings

|||
|-|-|
|name|Excalidraw|
|description|Draw content from within a note.|
|icon|brush|
\

The source code that is built into the `build.html.json` file below can be [found at GitHub](https://github.com/alloy-org/amplenote-embed-starter/tree/excalidraw).

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
    try {
      const attachments = await app.getNoteAttachments(app.context.pluginUUID);
      const attachment = attachments.find(attachment => attachment.name === "build.html.json");
      if (!attachment) throw new Error("build.html.json attachment not found");
      return this._getAttachmentContent(app, attachment.uuid);
    } catch (error) {
      return `<div><em>renderEmbed error:</em> message => log(message, styles.red)</div>`;
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
