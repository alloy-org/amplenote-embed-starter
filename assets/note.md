|||
|-|-|
|name|example plugin|

```javascript
({
  appOption(app) {
    app.openSidebarEmbed(1);
  },
  async renderEmbed(app) {  
    try {
      const attachments = await app.getNoteAttachments(app.context.pluginUUID);
      const attachment = attachments.find(attachment => attachment.name === "build.html.json");
      if (!attachment) throw new Error("build.html.json attachment not found");
      return this._getAttachmentContent(app, attachment.uuid);
    } catch (error) {
      return `<div><em>renderEmbed error:</em> ${ error.toString() }</div>`;
    }
  },
  onEmbedCall(app, ...args) {
    console.log("onEmbedCall", args);
    return "result";
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

[build.html.json](./build.html.json)
