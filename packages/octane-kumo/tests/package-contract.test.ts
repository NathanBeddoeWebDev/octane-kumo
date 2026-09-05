import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  Autocomplete as RootAutocomplete,
  Badge as RootBadge,
  Banner as RootBanner,
  Breadcrumbs as RootBreadcrumbs,
  Button as RootButton,
  Checkbox as RootCheckbox,
  ClipboardText as RootClipboardText,
  CommandPalette as RootCommandPalette,
  DeleteResource as RootDeleteResource,
  Flow as RootFlow,
  Toast as RootToast,
  Toasty as RootToasty,
  ToastProvider as RootToastProvider,
  createKumoToastManager as RootCreateToastManager,
  useKumoToastManager as RootUseToastManager,
  CloudflareLogo as RootCloudflareLogo,
  PoweredByCloudflare as RootPoweredByCloudflare,
  Code as RootCode,
  CodeBlock as RootCodeBlock,
  Collapsible as RootCollapsible,
  Combobox as RootCombobox,
  DatePicker as RootDatePicker,
  DateRangePicker as RootDateRangePicker,
  Dialog as RootDialog,
  DropdownMenu as RootDropdownMenu,
  Empty as RootEmpty,
  Field as RootField,
  Grid as RootGrid,
  Input as RootInput,
  InputArea as RootInputArea,
  InputGroup as RootInputGroup,
  Label as RootLabel,
  LayerCard as RootLayerCard,
  Link as RootLink,
  MenuBar as RootMenuBar,
  Meter as RootMeter,
  Pagination as RootPagination,
  Popover as RootPopover,
  Radio as RootRadio,
  RadioGroup as RootRadioGroup,
  Select as RootSelect,
  SensitiveInput as RootSensitiveInput,
  Sidebar as RootSidebar,
  SkeletonLine as RootSkeletonLine,
  Surface as RootSurface,
  Switch as RootSwitch,
  Table as RootTable,
  TableOfContents as RootTableOfContents,
  Tabs as RootTabs,
  Text as RootText,
  Textarea as RootTextarea,
  Toolbar as RootToolbar,
} from "octane-kumo";
import { Autocomplete as SubpathAutocomplete } from "octane-kumo/components/autocomplete";
import { Badge as SubpathBadge } from "octane-kumo/components/badge";
import { Banner as SubpathBanner } from "octane-kumo/components/banner";
import { Breadcrumbs as SubpathBreadcrumbs } from "octane-kumo/components/breadcrumbs";
import { Button as SubpathButton } from "octane-kumo/components/button";
import { Checkbox as SubpathCheckbox } from "octane-kumo/components/checkbox";
import { ClipboardText as SubpathClipboardText } from "octane-kumo/components/clipboard-text";
import { CommandPalette as SubpathCommandPalette } from "octane-kumo/components/command-palette";
import { DeleteResource as SubpathDeleteResource } from "octane-kumo/components/delete-resource";
import { Flow as SubpathFlow } from "octane-kumo/components/flow";
import {
  Toast as SubpathToast,
  Toasty as SubpathToasty,
  ToastProvider as SubpathToastProvider,
  createKumoToastManager as SubpathCreateToastManager,
  useKumoToastManager as SubpathUseToastManager,
} from "octane-kumo/components/toast";
import {
  Code as SubpathCode,
  CodeBlock as SubpathCodeBlock,
} from "octane-kumo/components/code";
import { CodeBlock as ServerCodeBlock } from "octane-kumo/code/server";
import {
  CloudflareLogo as SubpathCloudflareLogo,
  PoweredByCloudflare as SubpathPoweredByCloudflare,
} from "octane-kumo/components/cloudflare-logo";
import { Collapsible as SubpathCollapsible } from "octane-kumo/components/collapsible";
import { Combobox as SubpathCombobox } from "octane-kumo/components/combobox";
import { DatePicker as SubpathDatePicker } from "octane-kumo/components/date-picker";
import SubpathDateRangePicker from "octane-kumo/components/date-range-picker";
import { Dialog as SubpathDialog } from "octane-kumo/components/dialog";
import { DropdownMenu as SubpathDropdownMenu } from "octane-kumo/components/dropdown";
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
import { MenuBar as SubpathMenuBar } from "octane-kumo/components/menubar";
import { Meter as SubpathMeter } from "octane-kumo/components/meter";
import { Pagination as SubpathPagination } from "octane-kumo/components/pagination";
import { Table as SubpathTable } from "octane-kumo/components/table";
import { Popover as SubpathPopover } from "octane-kumo/components/popover";
import {
  Radio as SubpathRadio,
  RadioGroup as SubpathRadioGroup,
} from "octane-kumo/components/radio";
import { SensitiveInput as SubpathSensitiveInput } from "octane-kumo/components/sensitive-input";
import { Select as SubpathSelect } from "octane-kumo/components/select";
import { Sidebar as SubpathSidebar } from "octane-kumo/components/sidebar";
import { Surface as SubpathSurface } from "octane-kumo/components/surface";
import { Switch as SubpathSwitch } from "octane-kumo/components/switch";
import { TableOfContents as SubpathTableOfContents } from "octane-kumo/components/table-of-contents";
import { Tabs as SubpathTabs } from "octane-kumo/components/tabs";
import { Text as SubpathText } from "octane-kumo/components/text";
import { Toolbar as SubpathToolbar } from "octane-kumo/components/toolbar";

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
    expect(RootCommandPalette).toBe(SubpathCommandPalette);
    expect(RootDeleteResource).toBe(SubpathDeleteResource);
    expect(RootFlow).toBe(SubpathFlow);
    expect(RootClipboardText).toBe(SubpathClipboardText);
    expect(RootToast).toBe(SubpathToast);
    expect(RootToasty).toBe(SubpathToasty);
    expect(RootToastProvider).toBe(SubpathToastProvider);
    expect(RootCreateToastManager).toBe(SubpathCreateToastManager);
    expect(RootUseToastManager).toBe(SubpathUseToastManager);
    expect(RootCode).toBe(SubpathCode);
    expect(RootCodeBlock).toBe(SubpathCodeBlock);
    expect(RootCode.Block).toBe(RootCodeBlock);
    expect(ServerCodeBlock).not.toBe(RootCodeBlock);
    expect(RootDatePicker).toBe(SubpathDatePicker);
    expect(RootDateRangePicker).toBe(SubpathDateRangePicker);
    expect(RootPagination).toBe(SubpathPagination);
    expect(RootTable).toBe(SubpathTable);
    expect(RootAutocomplete).toBe(SubpathAutocomplete);
    expect(RootBadge).toBe(SubpathBadge);
    expect(RootBanner).toBe(SubpathBanner);
    expect(RootBreadcrumbs).toBe(SubpathBreadcrumbs);
    expect(RootButton).toBe(SubpathButton);
    expect(RootCheckbox).toBe(SubpathCheckbox);
    expect(RootCloudflareLogo).toBe(SubpathCloudflareLogo);
    expect(RootPoweredByCloudflare).toBe(SubpathPoweredByCloudflare);
    expect(RootCollapsible).toBe(SubpathCollapsible);
    expect(RootCombobox).toBe(SubpathCombobox);
    expect(RootDialog).toBe(SubpathDialog);
    expect(RootDropdownMenu).toBe(SubpathDropdownMenu);
    expect(RootEmpty).toBe(SubpathEmpty);
    expect(RootField).toBe(SubpathField);
    expect(RootGrid).toBe(SubpathGrid);
    expect(RootInput).toBe(SubpathInput);
    expect(RootInputArea).toBe(SubpathInputArea);
    expect(RootInputGroup).toBe(SubpathInputGroup);
    expect(RootLabel).toBe(SubpathLabel);
    expect(RootLayerCard).toBe(SubpathLayerCard);
    expect(RootLink).toBe(SubpathLink);
    expect(RootMenuBar).toBe(SubpathMenuBar);
    expect(RootMeter).toBe(SubpathMeter);
    expect(RootPopover).toBe(SubpathPopover);
    expect(RootRadio).toBe(SubpathRadio);
    expect(RootRadioGroup).toBe(SubpathRadioGroup);
    expect(RootSelect).toBe(SubpathSelect);
    expect(RootSensitiveInput).toBe(SubpathSensitiveInput);
    expect(RootSidebar).toBe(SubpathSidebar);
    expect(RootSkeletonLine).toBe(SubpathSkeletonLine);
    expect(RootSurface).toBe(SubpathSurface);
    expect(RootSwitch).toBe(SubpathSwitch);
    expect(RootTableOfContents).toBe(SubpathTableOfContents);
    expect(RootTabs).toBe(SubpathTabs);
    expect(RootText).toBe(SubpathText);
    expect(RootTextarea).toBe(RootInputArea);
    expect(RootTextarea).toBe(SubpathTextarea);
    expect(RootToolbar).toBe(SubpathToolbar);
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
