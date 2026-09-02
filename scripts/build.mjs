import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const fingerprint = (content) => createHash("sha256").update(content).digest("hex").slice(0, 12);

await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });
const [html, app, oscillator, styles] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("src/app.mjs", "utf8"),
  readFile("src/oscillator.mjs", "utf8"),
  readFile("src/styles.css", "utf8"),
]);
const oscillatorVersion = fingerprint(oscillator);
const appVersion = fingerprint(app);
const stylesVersion = fingerprint(styles);
await writeFile(
  "dist/index.html",
  html
    .replaceAll("./src/app.mjs", `./app.mjs?v=${appVersion}`)
    .replaceAll("./src/styles.css", `./styles.css?v=${stylesVersion}`),
);
await writeFile("dist/app.mjs", app.replaceAll("./oscillator.mjs", `./oscillator.mjs?v=${oscillatorVersion}`));
await writeFile("dist/oscillator.mjs", oscillator);
await writeFile("dist/styles.css", styles);
