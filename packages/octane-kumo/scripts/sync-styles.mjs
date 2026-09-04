import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const upstreamRoot = resolve(packageRoot, "../kumo");
const upstreamManifest = JSON.parse(
  await readFile(resolve(upstreamRoot, "package.json"), "utf8"),
);

if (upstreamManifest.version !== "2.13.1") {
  throw new Error(
    `Expected @cloudflare/kumo@2.13.1, received ${upstreamManifest.version}. Update the upstream ledger and audit before syncing styles.`,
  );
}

const files = {
  "kumo-binding.css": "src/styles/kumo-binding.css",
  "kumo-standalone.css": "dist/styles/kumo-standalone.css",
  "kumo.css": "src/styles/kumo.css",
  "theme-fedramp.css": "src/styles/theme-fedramp.css",
  "theme-kumo.css": "src/styles/theme-kumo.css",
};
const output = resolve(packageRoot, "src/styles");

await mkdir(output, { recursive: true });
await Promise.all(
  Object.entries(files).map(([outputFile, sourceFile]) =>
    copyFile(resolve(upstreamRoot, sourceFile), resolve(output, outputFile)),
  ),
);
