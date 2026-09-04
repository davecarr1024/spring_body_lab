import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });
await promisify(execFile)("node_modules/.bin/tsc", []);
await cp("src/browser/styles.css", "dist/src/browser/styles.css");
await cp("src/browser/assets", "dist/src/browser/assets", { recursive: true });
const html = await readFile("index.html", "utf8");
await writeFile("dist/index.html", html
  .replace("./src/app.js", "./src/browser/app.js")
  .replace("./src/styles.css", "./src/browser/styles.css"));
const mossyard = await readFile("mossyard.html", "utf8");
await writeFile("dist/mossyard.html", mossyard
  .replace("./src/app.js", "./src/browser/app.js")
  .replace("./src/styles.css", "./src/browser/styles.css"));
const trail = await readFile("trail.html", "utf8");
await writeFile("dist/trail.html", trail
  .replace("./src/app.js", "./src/browser/app.js")
  .replace("./src/styles.css", "./src/browser/styles.css"));
