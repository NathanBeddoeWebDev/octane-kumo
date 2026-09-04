import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import styleSources from "../audit/style-sources.json";

const packageRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(packageRoot, "../..");

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("stylesheet provenance", () => {
  for (const file of styleSources.files) {
    it(`${file.target} matches the pinned Kumo source`, () => {
      const target = resolve(packageRoot, file.target);
      const source = resolve(repositoryRoot, file.source);

      expect(sha256(target)).toBe(file.sha256);
      if (!file.source.includes("/dist/")) {
        expect(existsSync(source)).toBe(true);
      }
      if (existsSync(source)) {
        expect(readFileSync(target)).toEqual(readFileSync(source));
      }
    });
  }
});
