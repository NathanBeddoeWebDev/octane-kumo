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
        "@octanejs/aria",
        "@octanejs/base-ui",
        "@octanejs/day-picker",
        "@octanejs/phosphor-icons",
        "@shikijs/langs",
        "@shikijs/themes",
        "shiki",
        "cnfast",
        "octane",
      ]) {
        linkDependency(consumerModules, dependency);
      }

      writeFileSync(
        resolve(consumerDirectory, "consumer.tsx"),
        `/** @jsxImportSource octane */
import {
  Autocomplete,
  type AutocompleteFilter,
  Badge,
  Banner,
  Breadcrumbs,
  Button,
  Checkbox,
  ClipboardText,
  Toasty,
  ToastProvider,
  Toast,
  createKumoToastManager,
  useKumoToastManager,
  type KumoToastManagerAddOptions,
  type KumoToastOptions,
  CloudflareLogo,
  PoweredByCloudflare,
  Code,
  CodeBlock,
  Collapsible,
  Combobox,
  type ComboboxFilter,
  DatePicker,
  DateRangePicker,
  Dialog,
  DropdownMenu,
  Empty,
  Field,
  Grid,
  GridItem,
  Input,
  InputArea,
  InputGroup,
  Label,
  LayerCard,
  Link,
  MenuBar,
  Meter,
  Pagination,
  Popover,
  Radio,
  RadioGroup,
  Select,
  SensitiveInput,
  Sidebar,
  SkeletonLine,
  Surface,
  Switch,
  Table,
  TableOfContents,
  Tabs,
  Text,
  Textarea,
  Tooltip,
  Toolbar,
} from "octane-kumo";
import { ClipboardText as ClipboardTextSubpath } from "octane-kumo/components/clipboard-text";
import { Toasty as ToastySubpath, Toast as ToastSubpath, createKumoToastManager as CreateToastSubpath } from "octane-kumo/components/toast";
import { Code as CodeSubpath, type CodeLang } from "octane-kumo/components/code";
import { ShikiProvider, CodeHighlighted, useShikiHighlighter, normalizeLanguage, LANGUAGE_ALIASES, type LanguageInput } from "octane-kumo/code";
import { CodeBlock as ServerCodeBlock, highlightCode, createServerHighlighter } from "octane-kumo/code/server";
import { Autocomplete as AutocompleteSubpath } from "octane-kumo/components/autocomplete";
import { Badge as BadgeSubpath } from "octane-kumo/components/badge";
import { Banner as BannerSubpath } from "octane-kumo/components/banner";
import { Breadcrumbs as BreadcrumbsSubpath } from "octane-kumo/components/breadcrumbs";
import {
  CloudflareLogo as CloudflareLogoSubpath,
  PoweredByCloudflare as PoweredByCloudflareSubpath,
} from "octane-kumo/components/cloudflare-logo";
import { Checkbox as CheckboxSubpath } from "octane-kumo/components/checkbox";
import { Collapsible as CollapsibleSubpath } from "octane-kumo/components/collapsible";
import { Combobox as ComboboxSubpath } from "octane-kumo/components/combobox";
import { DatePicker as DatePickerSubpath, type DateRange, type DayPickerProps } from "octane-kumo/components/date-picker";
import LegacyDateRangePicker, { dateRangePickerVariants } from "octane-kumo/components/date-range-picker";
import { Dialog as DialogSubpath } from "octane-kumo/components/dialog";
import { DropdownMenu as DropdownMenuSubpath } from "octane-kumo/components/dropdown";
import { Empty as EmptySubpath } from "octane-kumo/components/empty";
import { Field as FieldSubpath } from "octane-kumo/components/field";
import {
  Input as InputSubpath,
  InputArea as InputAreaSubpath,
  Textarea as TextareaSubpath,
} from "octane-kumo/components/input";
import { InputGroup as InputGroupSubpath } from "octane-kumo/components/input-group";
import { Label as LabelSubpath } from "octane-kumo/components/label";
import { LayerCard as LayerCardSubpath } from "octane-kumo/components/layer-card";
import { Link as LinkSubpath } from "octane-kumo/components/link";
import { SkeletonLine as SkeletonLineSubpath } from "octane-kumo/components/loader";
import { MenuBar as MenuBarSubpath } from "octane-kumo/components/menubar";
import { Meter as MeterSubpath } from "octane-kumo/components/meter";
import { Pagination as PaginationSubpath, PaginationInfo, PaginationControls, PaginationSeparator, PaginationPageSize, paginationVariants, type PaginationProps } from "octane-kumo/components/pagination";
import { Table as TableSubpath, KUMO_TABLE_VARIANTS, type KumoTableLayout } from "octane-kumo/components/table";
import { Popover as PopoverSubpath } from "octane-kumo/components/popover";
import { Radio as RadioSubpath } from "octane-kumo/components/radio";
import { SensitiveInput as SensitiveInputSubpath } from "octane-kumo/components/sensitive-input";
import { Select as SelectSubpath } from "octane-kumo/components/select";
import { Sidebar as SidebarSubpath } from "octane-kumo/components/sidebar";
import { Surface as SurfaceSubpath } from "octane-kumo/components/surface";
import { Switch as SwitchSubpath } from "octane-kumo/components/switch";
import { TableOfContents as TableOfContentsSubpath } from "octane-kumo/components/table-of-contents";
import { Tabs as TabsSubpath } from "octane-kumo/components/tabs";
import { Text as TextSubpath } from "octane-kumo/components/text";
import { Toolbar as ToolbarSubpath } from "octane-kumo/components/toolbar";
import { Grid as GridSubpath } from "octane-kumo/components/grid";
import { GridItem as GridItemSubpath } from "octane-kumo/components/grid";

const inputRef: { current: HTMLInputElement | null } = { current: null };
const inputAreaRef: { current: HTMLTextAreaElement | null } = { current: null };
const checkboxRef: { current: HTMLButtonElement | null } = { current: null };
const clipboardRef: { current: HTMLDivElement | null } = { current: null };
const toastManager = createKumoToastManager();
const notification: KumoToastManagerAddOptions<{ count: number }> = { variant: "success", title: <span>Saved</span>, data: { count: 1 }, actions: [{ children: "Undo", onClick: event => event.preventDefault() }] };
toastManager.add(notification);
toastManager.update("saved", { variant: "info", content: <strong>Updated</strong> });
toastManager.promise(Promise.resolve(42), { loading: { title: "Loading" }, success: value => ({ title: value.toFixed(), variant: "success", data: { count: value } }), error: error => ({ title: error.message, variant: "error" }) });
// @ts-expect-error Kumo variants remain a closed union.
toastManager.add({ variant: "purple" });
// @ts-expect-error Toast actions use native DOM events, not synthetic events.
toastManager.add({ actions: [{ onClick: (event: { nativeEvent: MouseEvent }) => { void event; } }] });
function ToastConsumer() {
  const manager = useKumoToastManager();
  const items: KumoToastOptions[] = manager.toasts;
  return <Button onClick={() => manager.add({ title: "From hook", variant: "info" })}>{items.length}</Button>;
}
const autocompleteFilter: AutocompleteFilter = Autocomplete.useFilter({
  locale: "en",
});
const comboboxFilter: ComboboxFilter = Combobox.useFilter({
  multiple: true,
  value: [],
});
autocompleteFilter.contains({ label: "Brazil" }, "bra", (item) => item.label);
comboboxFilter.startsWith({ label: "French" }, "fre", (item) => item.label);
void [
  AutocompleteSubpath,
  BadgeSubpath,
  BannerSubpath,
  BreadcrumbsSubpath,
  CheckboxSubpath,
  CloudflareLogoSubpath,
  PoweredByCloudflareSubpath,
  CollapsibleSubpath,
  ComboboxSubpath,
  DialogSubpath,
  DropdownMenuSubpath,
  EmptySubpath,
  FieldSubpath,
  GridSubpath,
  GridItemSubpath,
  InputSubpath,
  InputAreaSubpath,
  InputGroupSubpath,
  LabelSubpath,
  LayerCardSubpath,
  LinkSubpath,
  MenuBarSubpath,
  MeterSubpath,
  PaginationSubpath,
  paginationVariants(),
  TableSubpath,
  PopoverSubpath,
  RadioSubpath,
  SensitiveInputSubpath,
  SelectSubpath,
  SidebarSubpath,
  SkeletonLineSubpath,
  SurfaceSubpath,
  SwitchSubpath,
  TableOfContentsSubpath,
  TabsSubpath,
  TextSubpath,
  TextareaSubpath,
  ToolbarSubpath,
];

export const consumerView = (
  <div>
    <Toasty toastManager={toastManager}><ToastConsumer /></Toasty>
    <ToastProvider container={{ current: null }}><span>Alias</span></ToastProvider>
    <ToastySubpath toastManager={CreateToastSubpath()}><span>Subpath</span></ToastySubpath>
    <Toast.Provider><Toast.Viewport /></Toast.Provider>
    {void ToastSubpath.createToastManager()}
    <ClipboardText text="Shown" textToCopy="" ref={clipboardRef} tooltip={{ side: "left", text: "Copy", copiedText: "Copied" }} labels={{ copyAction: "Copy value" }} onCopy={() => {}} />
    <ClipboardTextSubpath text="Subpath" size="sm" />
    <Code code="const n = 1" lang={"ts" satisfies CodeLang} style={{ whiteSpace: "pre-wrap" }} values={{ n: { value: "2" } }} />
    <Code.Block code="echo hello" lang="bash" />
    <CodeBlock code="{}" lang="jsonc" />
    <CodeSubpath code="body {}" lang="css" className="custom-code" />
    <ShikiProvider engine="javascript" languages={["ts", "json"] satisfies LanguageInput[]} labels={{ copy: "Copy source" }}>
      <CodeHighlighted code="const n = 1" lang="ts" showLineNumbers highlightLines={[1]} showCopyButton />
    </ShikiProvider>
    <ServerCodeBlock html="<pre><code>trusted</code></pre>" />
    {void [useShikiHighlighter, normalizeLanguage("ts"), LANGUAGE_ALIASES, highlightCode, createServerHighlighter]}
    <DatePicker mode="single" onChange={(date, trigger, modifiers, event) => { date?.getDate(); trigger.getDate(); void modifiers.selected; event.preventDefault(); }} footer={<span>Choose a date</span>} />
    <DatePicker mode="single" required selected={new Date()} onChange={(date) => date.getDate()} />
    <DatePickerSubpath mode="multiple" onChange={(dates) => dates?.map((date) => date.getDate())} />
    <DatePickerSubpath mode="multiple" required selected={[]} onChange={(dates) => dates.map((date) => date.getDate())} />
    <DatePickerSubpath mode="range" onChange={(range) => { const value: DateRange | undefined = range; void value; }} />
    <DatePickerSubpath mode="range" required selected={undefined} onChange={(range) => range.from?.getDate()} components={{ Root: ({ rootRef, children, ...props }) => <div {...props} ref={rootRef}>{children}</div>, Chevron: ({ className }) => <span className={className}>Next</span> }} onDayKeyDown={(_day, _modifiers, event) => event.key.toUpperCase()} />
    <DateRangePicker onStartDateChange={(date) => date?.getDate()} onEndDateChange={(date) => date?.getDate()} />
    <LegacyDateRangePicker size="sm" variant="subtle" className={dateRangePickerVariants()} onStartDateChange={() => {}} onEndDateChange={() => {}} />
    {void ({ mode: "single", selected: new Date(), onSelect: (date) => date?.getDate() } satisfies DayPickerProps)}
    <Table layout={"fixed" satisfies KumoTableLayout} ref={{ current: null }}>
      <Table.Header variant="compact" sticky><Table.Row><Table.CheckHead indeterminate onCheckedChange={(checked, details) => { void checked; details?.cancel(); }} /><Table.Head sticky="left" scope="col">Name<Table.ResizeHandle onPointerDown={(event) => event.preventDefault()} /></Table.Head></Table.Row></Table.Header>
      <Table.Body><Table.Row variant="selected"><Table.CheckCell checked label="Worker" onValueChange={(checked) => { void checked; }} /><Table.Cell sticky="right" colSpan={2}>Worker</Table.Cell></Table.Row></Table.Body>
      <Table.Footer><Table.Row><Table.Cell>Total</Table.Cell></Table.Row></Table.Footer>
    </Table>
    <Pagination page={2} setPage={(page) => page.toFixed()} perPage={10} totalCount={100} labels={{ pageNumber: "Page" }}>
      <Pagination.Info>{({ pageShowingRange }) => pageShowingRange}</Pagination.Info>
      <Pagination.Separator />
      <Pagination.PageSize value={10} onChange={(size) => size.toFixed()} />
      <Pagination.Controls pageSelector="dropdown" />
    </Pagination>
    <PaginationSubpath {...({ setPage: (page) => page.toFixed(), hasNextPage: true } satisfies PaginationProps)} />
    <PaginationSubpath setPage={() => {}} totalCount={100} perPage={10}>
      <PaginationInfo /><PaginationSeparator /><PaginationControls controls="simple" /><PaginationPageSize value={10} onChange={() => {}} />
    </PaginationSubpath>
    <TableSubpath className={KUMO_TABLE_VARIANTS.layout.fixed.classes} />
    <Badge variant="success" appearance="dot">Operational</Badge>
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
    <Label htmlFor="region">Region</Label>
    <Input
      id="region"
      ref={inputRef}
      label="Region"
      description="Deployment region"
      passwordManagerIgnore
      onValueChange={(value, details) => {
        value.toUpperCase();
        details.event.preventDefault();
      }}
    />
    <Field label="Worker name" error={{ message: "Required", match: true }}>
      <Input aria-label="Worker name" />
    </Field>
    <InputArea
      label="Notes"
      ref={inputAreaRef}
      autoResize
      onValueChange={(value) => value.trim()}
    />
    <Textarea aria-label="Summary" minRows={2} />
    <InputGroup label="Worker subdomain">
      <InputGroup.Addon>@</InputGroup.Addon>
      <InputGroup.Input ref={inputRef} onValueChange={(value) => value.trim()} />
      <InputGroup.Suffix>.workers.dev</InputGroup.Suffix>
      <InputGroup.Button variant="secondary">Check</InputGroup.Button>
    </InputGroup>
    <SensitiveInput
      defaultValue="secret"
      label="API token"
      onCopy={() => {}}
      onValueChange={(value) => value.trim()}
      ref={inputRef}
    />
    <Checkbox
      ref={checkboxRef}
      label="Enable logs"
      onCheckedChange={(checked, details) => {
        Boolean(checked);
        details.event.preventDefault();
      }}
    />
    <Checkbox.Group legend="Channels" defaultValue={["email"]}>
      <Checkbox.Item label="Email" value="email" />
      <Checkbox.Legend className="sr-only">Notification channels</Checkbox.Legend>
    </Checkbox.Group>
    <Switch
      label="Enable alerts"
      name="alerts"
      onCheckedChange={(checked) => Boolean(checked)}
      value="enabled"
    />
    <Switch.Group legend="Alert types">
      <Switch.Item label="Deployments" variant="neutral" />
      <Switch.Legend className="sr-only">Notifications</Switch.Legend>
    </Switch.Group>
    <RadioGroup<number>
      defaultValue={25}
      legend="Items per page"
      name="pageSize"
      onValueChange={(value, details) => {
        value.toFixed();
        details.allowPropagation();
      }}
    >
      <Radio.Item<number> label="10" value={10} />
      <Radio.Item<number> label="25" value={25} />
    </RadioGroup>
    <Select
      aria-label="Environment"
      items={{ production: "Production", staging: "Staging" }}
      onValueChange={(value) => String(value)}
    />
    <Autocomplete aria-label="Country" items={["Argentina", "Brazil"]}>
      <Autocomplete.InputGroup placeholder="Country" />
      <Autocomplete.Content>
        <Autocomplete.List>
          {(country: string) => (
            <Autocomplete.Item value={country}>{country}</Autocomplete.Item>
          )}
        </Autocomplete.List>
      </Autocomplete.Content>
    </Autocomplete>
    <Combobox
      aria-label="Language"
      items={[
        { label: "English", value: "en" },
        { label: "French", value: "fr" },
      ]}
      itemToStringLabel={(language) => language.label}
    >
      <Combobox.TriggerInput placeholder="Language" />
      <Combobox.Content>
        <Combobox.List>
          {(language: { label: string; value: string }) => (
            <Combobox.Item value={language}>{language.label}</Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
    <Meter label="Storage" max={1000} value={650} />
    <SkeletonLine blockHeight={24} minWidth={60} maxWidth={80} />
    <Empty
      commandLine="pnpm add octane-kumo"
      contents={<Button>Create resource</Button>}
      title="No resources"
    />
    <Collapsible.Root
      defaultOpen
      onOpenChange={(open, details) => {
        Boolean(open);
        details.allowPropagation();
      }}
    >
      <Collapsible.DefaultTrigger>Details</Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel keepMounted>Content</Collapsible.DefaultPanel>
    </Collapsible.Root>
    <Dialog.Root>
      <Dialog.Trigger render={<Button />}>Open dialog</Dialog.Trigger>
      <Dialog size="lg">
        <Dialog.Title>Settings</Dialog.Title>
        <Dialog.Description>Update your settings.</Dialog.Description>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog>
    </Dialog.Root>
    <Popover>
      <Popover.Trigger render={<Button />}>Open popover</Popover.Trigger>
      <Popover.Content side="right" align="start">
        <Popover.Title>Details</Popover.Title>
        <Popover.Description>More information.</Popover.Description>
        <Popover.Close>Dismiss</Popover.Close>
      </Popover.Content>
    </Popover>
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button />}>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>
        <DropdownMenu.CheckboxItem defaultChecked>Notifications</DropdownMenu.CheckboxItem>
        <DropdownMenu.RadioGroup defaultValue="comfortable">
          <DropdownMenu.RadioItem value="compact">Compact</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="comfortable">
            Comfortable
            <DropdownMenu.RadioItemIndicator />
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.LinkItem href="/settings">Settings</DropdownMenu.LinkItem>
      </DropdownMenu.Content>
    </DropdownMenu>
    <Tabs
      selectedValue="overview"
      tabs={[
        { value: "overview", label: "Overview" },
        { value: "settings", label: "Settings" },
      ]}
      onValueChange={(value) => value.toUpperCase()}
    />
    <Toolbar aria-label="Record tools">
      <Toolbar.Input aria-label="Search records" />
      <Toolbar.Button>Apply</Toolbar.Button>
      <Toolbar.Link href="/docs">Documentation</Toolbar.Link>
    </Toolbar>
    <MenuBar
      isActive="list"
      optionIds
      options={[
        {
          id: "list",
          icon: <span aria-hidden="true">L</span>,
          tooltip: "List view",
          onClick: () => {},
        },
      ]}
    />
    <Text variant="body">Body copy</Text>
    <Text variant="heading" as="h2">Section</Text>
    <Link href="/docs">Learn more</Link>
    <Banner title="Update available" description="A new version is ready." />
    <Banner variant="alert" size="sm" title="Heads up" description="Check usage." />
    <Breadcrumbs>
      <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
      <Breadcrumbs.Separator />
      <Breadcrumbs.Current>Current page</Breadcrumbs.Current>
    </Breadcrumbs>
    <LayerCard>Card content</LayerCard>
    <LayerCard>
      <LayerCard.Secondary>Next steps</LayerCard.Secondary>
      <LayerCard.Primary>Seen</LayerCard.Primary>
    </LayerCard>
    <Surface>Surface content</Surface>
    <Grid variant="2up">
      <GridItem>Left</GridItem>
      <GridItem>Right</GridItem>
    </Grid>
    <CloudflareLogo variant="glyph" color="color" />
    <PoweredByCloudflare />
    <TableOfContents>
      <TableOfContents.Title>On this page</TableOfContents.Title>
      <TableOfContents.List>
        <TableOfContents.Item href="#overview">Overview</TableOfContents.Item>
      </TableOfContents.List>
    </TableOfContents>
    <Sidebar.Provider defaultOpen>
      <Sidebar>
        <Sidebar.Header>Header</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Menu>
            <Sidebar.MenuButton>Home</Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Content>
        <Sidebar.Footer>Footer</Sidebar.Footer>
      </Sidebar>
    </Sidebar.Provider>
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
        { stdio: "inherit" },
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
