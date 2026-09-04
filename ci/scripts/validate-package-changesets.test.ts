import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findPackagesMissingChangesets,
  parseChangesetPackages,
  VERSIONED_PACKAGES,
} from "./validate-package-changesets";

describe("package changeset validation", () => {
  it("parses every package in changeset frontmatter", () => {
    assert.deepEqual(
      parseChangesetPackages(`---
"@cloudflare/kumo": patch
"octane-kumo": minor
---

Release notes.
`),
      ["@cloudflare/kumo", "octane-kumo"],
    );
  });

  it("reports each changed package without a matching changeset", () => {
    assert.deepEqual(
      findPackagesMissingChangesets(VERSIONED_PACKAGES, [
        { name: "octane.md", packages: ["octane-kumo"] },
      ]),
      [{ name: "@cloudflare/kumo", path: "packages/kumo" }],
    );
  });
});
