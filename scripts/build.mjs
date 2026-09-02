import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
const html = await readFile("index.html", "utf8");
await writeFile("dist/index.html", html
  .replace("./src/app.mjs", "./src/browser/app.mjs")
  .replace("./src/styles.css", "./src/browser/styles.css"));
