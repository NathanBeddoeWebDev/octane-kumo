import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  Badge as RootBadge,
  Banner as RootBanner,
  Breadcrumbs as RootBreadcrumbs,
  Button as RootButton,
  Checkbox as RootCheckbox,
  CloudflareLogo as RootCloudflareLogo,
  PoweredByCloudflare as RootPoweredByCloudflare,
  Collapsible as RootCollapsible,
  Empty as RootEmpty,
  Field as RootField,
  Grid as RootGrid,
  Input as RootInput,
  InputArea as RootInputArea,
  InputGroup as RootInputGroup,
  Label as RootLabel,
  LayerCard as RootLayerCard,
  Link as RootLink,
  Meter as RootMeter,
  Radio as RootRadio,
  RadioGroup as RootRadioGroup,
  SensitiveInput as RootSensitiveInput,
  Sidebar as RootSidebar,
  SkeletonLine as RootSkeletonLine,
  Surface as RootSurface,
  Switch as RootSwitch,
  TableOfContents as RootTableOfContents,
  Text as RootText,
  Textarea as RootTextarea,
} from "octane-kumo";
import { Badge as SubpathBadge } from "octane-kumo/components/badge";
import { Banner as SubpathBanner } from "octane-kumo/components/banner";
import { Breadcrumbs as SubpathBreadcrumbs } from "octane-kumo/components/breadcrumbs";
import { Button as SubpathButton } from "octane-kumo/components/button";
import { Checkbox as SubpathCheckbox } from "octane-kumo/components/checkbox";
import {
  CloudflareLogo as SubpathCloudflareLogo,
  PoweredByCloudflare as SubpathPoweredByCloudflare,
} from "octane-kumo/components/cloudflare-logo";
import { Collapsible as SubpathCollapsible } from "octane-kumo/components/collapsible";
import { Empty as SubpathEmpty } from "octane-kumo/components/empty";
import { Field as SubpathField } from "octane-kumo/components/field";
import { Grid as SubpathGrid } from "octane-kumo/components/grid";
import {
  Input as SubpathInput,
  InputArea as SubpathInputArea,
  Textarea as SubpathTextarea,
} from "octane-kumo/components/input";
import { InputGroup as SubpathInputGroup } from "octane-kumo/components/input-group";
import { Label as SubpathLabel } from "octane-kumo/components/label";
import { LayerCard as SubpathLayerCard } from "octane-kumo/components/layer-card";
import { Link as SubpathLink } from "octane-kumo/components/link";
import { SkeletonLine as SubpathSkeletonLine } from "octane-kumo/components/loader";
import { Meter as SubpathMeter } from "octane-kumo/components/meter";
import {
  Radio as SubpathRadio,
  RadioGroup as SubpathRadioGroup,
} from "octane-kumo/components/radio";
import { SensitiveInput as SubpathSensitiveInput } from "octane-kumo/components/sensitive-input";
import { Sidebar as SubpathSidebar } from "octane-kumo/components/sidebar";
import { Surface as SubpathSurface } from "octane-kumo/components/surface";
import { Switch as SubpathSwitch } from "octane-kumo/components/switch";
import { TableOfContents as SubpathTableOfContents } from "octane-kumo/components/table-of-contents";
import { Text as SubpathText } from "octane-kumo/components/text";

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
    expect(RootBadge).toBe(SubpathBadge);
    expect(RootBanner).toBe(SubpathBanner);
    expect(RootBreadcrumbs).toBe(SubpathBreadcrumbs);
    expect(RootButton).toBe(SubpathButton);
    expect(RootCheckbox).toBe(SubpathCheckbox);
    expect(RootCloudflareLogo).toBe(SubpathCloudflareLogo);
    expect(RootPoweredByCloudflare).toBe(SubpathPoweredByCloudflare);
    expect(RootCollapsible).toBe(SubpathCollapsible);
    expect(RootEmpty).toBe(SubpathEmpty);
    expect(RootField).toBe(SubpathField);
    expect(RootGrid).toBe(SubpathGrid);
    expect(RootInput).toBe(SubpathInput);
    expect(RootInputArea).toBe(SubpathInputArea);
    expect(RootInputGroup).toBe(SubpathInputGroup);
    expect(RootLabel).toBe(SubpathLabel);
    expect(RootLayerCard).toBe(SubpathLayerCard);
    expect(RootLink).toBe(SubpathLink);
    expect(RootMeter).toBe(SubpathMeter);
    expect(RootRadio).toBe(SubpathRadio);
    expect(RootRadioGroup).toBe(SubpathRadioGroup);
    expect(RootSensitiveInput).toBe(SubpathSensitiveInput);
    expect(RootSidebar).toBe(SubpathSidebar);
    expect(RootSkeletonLine).toBe(SubpathSkeletonLine);
    expect(RootSurface).toBe(SubpathSurface);
    expect(RootSwitch).toBe(SubpathSwitch);
    expect(RootTableOfContents).toBe(SubpathTableOfContents);
    expect(RootText).toBe(SubpathText);
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
