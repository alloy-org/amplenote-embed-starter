import serve, { error, log } from "create-serve";
import esbuild from "esbuild";
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

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body>
    <div id="root"></div>
    ${ scriptTag }
</body>
</html>
  `;
}

function buildMarkdown(html) {
  return `
|||
|-|-|
|name|example plugin|

\`\`\`
{
  appOption(app) {
    app.openSidebarEmbed();
  },
  renderEmbed(app) {
    return \`${ html }\`;
  },
  onEmbedCall(app, ...args) {
    console.log("onEmbedCall", args);
    return "result";
  },
}
\`\`\`
  `;
}

const packageNotePlugin = {
  name: "package-note-plugin",
  setup(build) {
    const options = build.initialOptions;
    options.write = false;

    build.onEnd(({ errors, outputFiles }) => {
      if (errors.length > 0) {
        console.error(errors);
      } else {
        const [ file ] = outputFiles;

        const htmlContent = buildHTML(file.text);
        const markdownContent = buildMarkdown(htmlContent);

        const markdownPath = path.join(path.dirname(file.path), "note.md");
        fs.writeFileSync(markdownPath, markdownContent);
      }
    });
  }
};

const serveBuildPlugin = {
  name: "update-dev-plugin",
  setup(build) {
    const options = build.initialOptions;
    options.write = false;

    // `window.callAmplenotePlugin` will be defined in the real embed environment
    options.banner = {
      js: `window.callAmplenotePlugin = function(...args) {
            console.log("window.callAmplenotePlugin", args);
          }`,
    }

    build.onEnd(({ errors, outputFiles }) => {
      if (errors.length > 0) {
        error(`Build failed: ${ JSON.stringify(errors) }`);
      } else {
        const [ file ] = outputFiles;

        const javascriptPath = path.join(path.dirname(file.path), "index.js");
        fs.writeFileSync(javascriptPath, file.text);

        const htmlContent = buildHTML(null, "./index.js");
        const htmlPath = path.join(path.dirname(file.path), "index.html");
        fs.writeFileSync(htmlPath, htmlContent);

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
  const context = await esbuild.context(buildOptions);
  await context.build();
}
