import { rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const coverage = process.argv[2] === "coverage";

await rm(".test-dist", { force: true, recursive: true });
await run("node_modules/.bin/tsc", ["--project", "tsconfig.test.json"]);
const args = [...(coverage ? ["--experimental-test-coverage"] : []), "--test", ".test-dist/tests"];
const { stdout, stderr } = await run(process.execPath, args);
process.stdout.write(stdout);
process.stderr.write(stderr);
