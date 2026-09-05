import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const fixturePath = fileURLToPath(
  new URL("../../octane-kumo/tests/parity/fixture.tsx", import.meta.url),
);

// Reuse the tested JSX verbatim; replace only the browser harness and renderer
// imports. Generated islands are build inputs, not another hand-maintained demo.
export async function generateExamples() {
  const source = await readFile(fixturePath, "utf8");
  const start = source.indexOf("function Fixture() {");
  const end = source.indexOf("createRoot(document.getElementById");
  assert.ok(start > 0 && end > start, "Parity fixture boundaries changed");
  const body = source
    .slice(start, end)
    .replace(
      "function Fixture() {",
      "export default function Fixture({ scenario }: { scenario: string }) {",
    );
  for (const runtime of ["octane", "react"]) {
    const library = runtime === "octane" ? "octane-kumo" : "@cloudflare/kumo";
    // Upstream Results is not generic. Erase only this native type argument;
    // the emitted JSX and behavior remain identical.
    const example =
      runtime === "react"
        ? body.replace(
            "<K.CommandPalette.Results<string>>",
            "<K.CommandPalette.Results>",
          )
        : body;
    const contents = `/** @jsxImportSource ${runtime} */
// Generated from octane-kumo/tests/parity/fixture.tsx. Do not edit.
import { useState } from "${runtime}";
import * as K from "${library}";
import { ShikiProvider, CodeHighlighted } from "${library}/code";
${example}`;
    const directory = new URL(`../src/examples/${runtime}/`, import.meta.url);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL("Fixture.tsx", directory), contents);
  }
}
