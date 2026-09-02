import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });
const html = await readFile("index.html", "utf8");
await writeFile(
  "dist/index.html",
  html.replaceAll("./src/app.mjs", "./app.mjs").replaceAll("./src/styles.css", "./styles.css"),
);
await cp("src/app.mjs", "dist/app.mjs");
await cp("src/oscillator.mjs", "dist/oscillator.mjs");
await cp("src/styles.css", "dist/styles.css");
