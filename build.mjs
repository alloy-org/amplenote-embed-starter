import serve, { error, log } from "create-serve";
import esbuild from "esbuild";
import JSZip from "jszip";
import fs from "node:fs";
import path from "node:path";

const IS_DEV = process.argv.includes("--dev");

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

        const base64JavascriptContent = Buffer.from(file.text).toString("base64");
        const htmlContent = fs.readFileSync(path.join("assets", "embed.html"), "utf8")
          .replace("__BASE64JAVASCRIPTCONTENT__", base64JavascriptContent);

        const markdownContent = fs.readFileSync(path.join("assets", "note.md"), "utf8");

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

    build.onEnd(({ errors, outputFiles }) => {
      if (errors.length > 0) {
        error(`Build failed: ${ JSON.stringify(errors) }`);
      } else {
        outputFiles.forEach(file => {
          const { path: outputPath } = file;

          if (outputPath.match(/\.js$/)) {
            const javascriptPath = path.join(path.dirname(outputPath), "index.js");
            fs.writeFileSync(javascriptPath, file.text);

            const htmlContent = fs.readFileSync(path.join("assets", "embed.dev.html"), "utf8");
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
    "process.env.IS_PREACT": '"false"',
  },
  entryPoints: [ "src/index.jsx" ],
  minify: !IS_DEV,
  outdir: "build",
  sourceRoot: "src",
  plugins: [ IS_DEV ? serveBuildPlugin : packageNotePlugin ],
  target: [ "chrome58" , "firefox57", "safari11", "edge18" ],
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
