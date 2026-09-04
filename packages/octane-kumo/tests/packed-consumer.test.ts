import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const packageRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(packageRoot, "../..");

function linkDependency(consumerModules: string, dependency: string) {
  const segments = dependency.split("/");
  const destination = resolve(consumerModules, ...segments);
  const source = resolve(packageRoot, "node_modules", ...segments);

  mkdirSync(resolve(destination, ".."), { recursive: true });
  symlinkSync(source, destination, "junction");
}

describe("packed consumer", () => {
  it("compiles against the published source exports", () => {
    const temporaryRoot = mkdtempSync(
      resolve(repositoryRoot, ".octane-kumo-consumer-"),
    );

    try {
      const packDirectory = resolve(temporaryRoot, "pack");
      const consumerDirectory = resolve(temporaryRoot, "consumer");
      const consumerModules = resolve(consumerDirectory, "node_modules");
      mkdirSync(packDirectory, { recursive: true });
      mkdirSync(consumerModules, { recursive: true });

      execFileSync("pnpm", ["pack", "--pack-destination", packDirectory], {
        cwd: packageRoot,
        stdio: "ignore",
      });
      const tarball = readdirSync(packDirectory).find((file) =>
        file.endsWith(".tgz"),
      );
      if (!tarball) throw new Error("pnpm pack did not produce a tarball");
      execFileSync(
        "tar",
        ["-xzf", resolve(packDirectory, tarball), "-C", packDirectory],
        { stdio: "ignore" },
      );
      renameSync(
        resolve(packDirectory, "package"),
        resolve(consumerModules, "octane-kumo"),
      );

      for (const dependency of [
        "@octanejs/base-ui",
        "@octanejs/phosphor-icons",
        "cnfast",
        "octane",
      ]) {
        linkDependency(consumerModules, dependency);
      }

      writeFileSync(
        resolve(consumerDirectory, "consumer.tsx"),
        `/** @jsxImportSource octane */
import { Button, Tooltip } from "octane-kumo";

export const consumerView = (
  <div>
    <Button aria-label="Save changes">Save</Button>
    <Button aria-labelledby="save-label">Save</Button>
    <Tooltip
      content="Details"
      render={(_triggerProps, state) => (
        <Button aria-pressed={state.open} variant="primary" />
      )}
    >
      Save
    </Tooltip>
  </div>
);
`,
      );
      writeFileSync(
        resolve(consumerDirectory, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            jsx: "react-jsx",
            jsxImportSource: "octane",
            lib: ["ES2023", "DOM", "DOM.Iterable"],
            module: "ES2022",
            moduleResolution: "bundler",
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: "ES2022",
          },
          include: ["consumer.tsx"],
        }),
      );

      execFileSync(
        "pnpm",
        [
          "--dir",
          packageRoot,
          "exec",
          "tsrx-tsc",
          "--noEmit",
          "-p",
          resolve(consumerDirectory, "tsconfig.json"),
        ],
        { stdio: "pipe" },
      );

      const packedManifest = JSON.parse(
        readFileSync(
          resolve(consumerModules, "octane-kumo/package.json"),
          "utf8",
        ),
      ) as { private?: boolean; publishConfig?: { access?: string } };
      expect(packedManifest.private).toBe(false);
      expect(packedManifest.publishConfig?.access).toBe("public");
    } finally {
      rmSync(temporaryRoot, { force: true, recursive: true });
    }
  }, 15_000);
});
