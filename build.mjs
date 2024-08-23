import serve, { error, log } from "create-serve";
import esbuild from "esbuild";
import JSZip from "jszip";
import fs from "node:fs";
import path from "node:path";

const IS_DEV = process.argv.includes("--dev");

function buildHTML(javascriptContent, javascriptPath) {
  let scriptTag;
  if (javascriptContent) {
    const base64JavascriptContent = Buffer.from(javascriptContent).toString("base64");
    scriptTag = `<script type="text/javascript" src="data:text/javascript;base64,${ base64JavascriptContent }"></script>`;
  } else if (javascriptPath) {
    scriptTag = `<script type="text/javascript" src="${ javascriptPath }"></script>`;
  } else {
    throw new Error("one of javascriptContent or javascriptPath must be provided");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body>
    <div id="root"></div>
    ${ scriptTag }
</body>
</html>`;
}

function buildMarkdown() {
  return `
|||
|-|-|
|name|example plugin|

\`\`\`
{
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
      return \`<div><em>renderEmbed error:</em> ${ error.toString() }</div>\`;
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
}
\`\`\`

[build.html.json](./build.html.json)
`;
}

const packageNotePlugin = {
  name: "package-note-plugin",
  setup(build) {
    const options = build.initialOptions;
    options.write = false;

    build.onEnd(async ({ errors, outputFiles }) => {
      if (errors.length > 0) {
        console.error(errors);
      } else {
        const [ file ] = outputFiles;

        const htmlContent = buildHTML(file.text);
        const markdownContent = buildMarkdown();

        const zip = new JSZip();
        zip.file("build.html.json", htmlContent);
        zip.file("note.md", markdownContent);
        const zipContent = await zip.generateAsync({ type: "nodebuffer" });

        const outputDirectory = path.dirname(file.path);

        if (!fs.existsSync(outputDirectory)) {
          fs.mkdirSync(outputDirectory);
        }

        const zipPath = path.join(outputDirectory, "plugin.zip");
        fs.writeFileSync(zipPath, zipContent);
      }
    });
  }
};

const serveBuildPlugin = {
  name: "update-dev-plugin",
  setup(build) {
    const options = build.initialOptions;
    options.write = false;
    options.sourcemap = true;

    // `window.callAmplenotePlugin` will be defined in the real embed environment
    options.banner = {
      js: `(() => { window.callAmplenotePlugin = function(...args) { console.log("window.callAmplenotePlugin", args); }; })();`,
    }

    build.onEnd(({ errors, outputFiles }) => {
      if (errors.length > 0) {
        error(`Build failed: ${ JSON.stringify(errors) }`);
      } else {
        outputFiles.forEach(file => {
          const { path: outputPath } = file;

          if (outputPath.match(/\.js$/)) {
            const javascriptPath = path.join(path.dirname(outputPath), "index.js");
            fs.writeFileSync(javascriptPath, file.text);

            const htmlContent = buildHTML(null, "./index.js");
            const htmlPath = path.join(path.dirname(outputPath), "index.html");
            fs.writeFileSync(htmlPath, htmlContent);
          } else if (outputPath.match(/\.js.map$/)) {
            const sourcemapPath = path.join(path.dirname(outputPath), "index.js.map");
            fs.writeFileSync(sourcemapPath, file.text);
          }
        });

        serve.update();
      }
    });
  }
};

const buildOptions = {
  bundle: true,
  define: {
    "process.env.NODE_ENV": IS_DEV ? '"development"' : '"production"',
  },
  entryPoints: [ "src/index.jsx" ],
  minify: !IS_DEV,
  outdir: "build",
  sourceRoot: "src",
  plugins: [ IS_DEV ? serveBuildPlugin : packageNotePlugin ],
  target: [ "chrome58" , "firefox57", "safari11", "edge16" ],
};

if (IS_DEV) {
  const context = await esbuild.context(buildOptions);
  context.watch();

  serve.start({
    port: 5000,
    root: "./build",
    live: true,
  });
} else {
  await esbuild.build(buildOptions);
}
