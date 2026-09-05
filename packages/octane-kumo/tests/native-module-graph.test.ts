import { resolve } from "node:path";
import { build, type Plugin } from "vite-plus";
import { describe, expect, it } from "vite-plus/test";
import { octane } from "octane/compiler/vite";

const packageRoot = resolve(import.meta.dirname, "..");
const forbiddenImports = ["react", "react-dom", "octane/react"];

describe("native module graph", () => {
  it("bundles without React or ReactCompat modules", async () => {
    const result = await build({
      build: {
        lib: {
          entry: {
            index: resolve(packageRoot, "src/index.ts"),
            code: resolve(packageRoot, "src/code/index.ts"),
            server: resolve(packageRoot, "src/code/server.tsx"),
          },
          formats: ["es"],
        },
        rollupOptions: {
          external: (id) =>
            id === "octane" ||
            id.startsWith("octane/") ||
            forbiddenImports.some(
              (dependency) =>
                id === dependency || id.startsWith(`${dependency}/`),
            ),
        },
        write: false,
      },
      configFile: false,
      logLevel: "silent",
      plugins: [octane({ requireDirective: true }) as unknown as Plugin],
      root: packageRoot,
    });
    const builds = Array.isArray(result) ? result : [result];
    const chunks = builds
      .flatMap((build) => ("output" in build ? build.output : []))
      .filter((output) => output.type === "chunk");
    const imports = chunks.flatMap((chunk) => [
      ...chunk.imports,
      ...chunk.dynamicImports,
    ]);

    for (const specifier of imports) {
      expect(
        forbiddenImports.some(
          (dependency) =>
            specifier === dependency || specifier.startsWith(`${dependency}/`),
        ),
      ).toBe(false);
    }
    const isShiki = (id: string) => /\/(?:@shikijs|shiki)[/@]/.test(id);
    expect(
      chunks.some((chunk) => Object.keys(chunk.modules).some(isShiki)),
    ).toBe(true);
    for (const entry of chunks.filter((chunk) => chunk.isEntry)) {
      const seen = new Set<string>();
      const visit = (fileName: string) => {
        if (seen.has(fileName)) return;
        seen.add(fileName);
        const chunk = chunks.find(
          (candidate) => candidate.fileName === fileName,
        );
        if (!chunk) return;
        expect(Object.keys(chunk.modules).some(isShiki)).toBe(false);
        for (const imported of chunk.imports) visit(imported);
        if (entry.name === "index") {
          // Even dynamic imports must be absent from the ordinary component graph.
          for (const imported of chunk.dynamicImports) visit(imported);
        }
      };
      visit(entry.fileName);
    }
  });
});
