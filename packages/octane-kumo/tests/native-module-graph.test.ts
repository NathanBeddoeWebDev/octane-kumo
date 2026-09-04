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
          entry: resolve(packageRoot, "src/index.ts"),
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
  });
});
