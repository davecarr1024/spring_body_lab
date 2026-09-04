import { readdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const coverage = process.argv[2] === "coverage";

await rm(".test-dist", { force: true, recursive: true });
await run("node_modules/.bin/tsc", ["--project", "tsconfig.test.json"]);
const tests = (await readdir(".test-dist/tests", { recursive: true }))
  .filter((file) => file.endsWith(".test.js"))
  .map((file) => `.test-dist/tests/${file}`);
const args = [...(coverage ? ["--experimental-test-coverage"] : []), "--test", ...tests];
const { stdout, stderr } = await run(process.execPath, args);
process.stdout.write(stdout);
process.stderr.write(stderr);
