import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  Button as RootButton,
  Checkbox as RootCheckbox,
  Field as RootField,
  Input as RootInput,
  InputArea as RootInputArea,
  Label as RootLabel,
  Radio as RootRadio,
  RadioGroup as RootRadioGroup,
  Switch as RootSwitch,
  Textarea as RootTextarea,
} from "octane-kumo";
import { Button as SubpathButton } from "octane-kumo/components/button";
import { Checkbox as SubpathCheckbox } from "octane-kumo/components/checkbox";
import { Field as SubpathField } from "octane-kumo/components/field";
import {
  Input as SubpathInput,
  InputArea as SubpathInputArea,
  Textarea as SubpathTextarea,
} from "octane-kumo/components/input";
import { Label as SubpathLabel } from "octane-kumo/components/label";
import {
  Radio as SubpathRadio,
  RadioGroup as SubpathRadioGroup,
} from "octane-kumo/components/radio";
import { Switch as SubpathSwitch } from "octane-kumo/components/switch";

const packageRoot = resolve(import.meta.dirname, "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|tsrx)$/.test(entry.name) ? [path] : [];
  });
}

describe("package contract", () => {
  it("resolves the root and component subpath to the same native export", () => {
    expect(RootButton).toBe(SubpathButton);
    expect(RootCheckbox).toBe(SubpathCheckbox);
    expect(RootField).toBe(SubpathField);
    expect(RootInput).toBe(SubpathInput);
    expect(RootInputArea).toBe(SubpathInputArea);
    expect(RootLabel).toBe(SubpathLabel);
    expect(RootRadio).toBe(SubpathRadio);
    expect(RootRadioGroup).toBe(SubpathRadioGroup);
    expect(RootSwitch).toBe(SubpathSwitch);
    expect(RootTextarea).toBe(RootInputArea);
    expect(RootTextarea).toBe(SubpathTextarea);
  });

  it("publishes only export targets that exist", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot, "package.json"), "utf8"),
    ) as {
      exports: Record<string, string | Record<string, string>>;
    };

    for (const value of Object.values(manifest.exports)) {
      const targets =
        typeof value === "string" ? [value] : Object.values(value);
      for (const target of targets) {
        expect(existsSync(resolve(packageRoot, target))).toBe(true);
      }
    }
  });

  it("keeps React and ReactCompat out of the native source graph", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const declared = {
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    };
    expect(Object.keys(declared)).not.toContain("react");
    expect(Object.keys(declared)).not.toContain("react-dom");

    const forbidden = [
      "react",
      "react-dom",
      "@base-ui/react",
      "@phosphor-icons/react",
      "motion/react",
      "octane/react",
    ];
    const imports: string[] = [];

    for (const file of sourceFiles(resolve(packageRoot, "src"))) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g,
      )) {
        imports.push(match[1]);
      }
    }

    for (const specifier of imports) {
      expect(
        forbidden.some(
          (dependency) =>
            specifier === dependency || specifier.startsWith(`${dependency}/`),
        ),
      ).toBe(false);
    }
  });
});
