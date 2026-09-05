/** @jsxImportSource octane */
/// <reference types="vite/client" />
// The runner compiles this SAME scenario source independently for each renderer.
// Its React transform only changes renderer/package imports, never scenarios.
import { createRoot, useState } from "octane";
import * as K from "octane-kumo";
import { ShikiProvider, CodeHighlighted } from "octane-kumo/code";
import "../../src/styles/standalone.css";

const scenario =
  new URLSearchParams(location.search).get("scenario") ?? "display";
document.documentElement.dataset.mode =
  new URLSearchParams(location.search).get("mode") ?? "light";

function Fixture() {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState<Date | undefined>(new Date(2024, 8, 10));
  const [selected, setSelected] = useState("none");
  const commands = ["Create", "Disabled", "Deploy"].filter((item) =>
    item.toLowerCase().includes(value.toLowerCase()),
  );
  return (
    <main data-ready="true">
      {scenario === "display" && (
        <>
          <div data-probe="Badge">
            <K.Badge variant="success">Healthy</K.Badge>
          </div>
          <div data-probe="Banner">
            <K.Banner
              variant="alert"
              title="Review settings"
              description="A deployment is pending."
            />
          </div>
          <div data-probe="Breadcrumbs">
            <K.Breadcrumbs>
              <K.Breadcrumbs.Link href="#account">Account</K.Breadcrumbs.Link>
              <K.Breadcrumbs.Current>Workers</K.Breadcrumbs.Current>
            </K.Breadcrumbs>
          </div>
          <div data-probe="Button">
            <K.Button onClick={() => setSelected("clicked")}>Deploy</K.Button>
          </div>
          <div data-probe="Button-disabled">
            <K.Button disabled>Disabled</K.Button>
          </div>
          <div data-probe="Button-loading">
            <K.Button loading>Saving</K.Button>
          </div>
          <div data-probe="RefreshButton">
            <K.RefreshButton title="Refresh" />
          </div>
          <div data-probe="LinkButton">
            <K.LinkButton href="#docs">Documentation</K.LinkButton>
          </div>
          <div data-probe="Label">
            <K.Label htmlFor="unused">Resource label</K.Label>
          </div>
          <div data-probe="Text">
            <K.Text>Body text</K.Text>
          </div>
          <div data-probe="Link">
            <K.Link href="#docs">Read documentation</K.Link>
          </div>
          <div data-probe="LayerCard">
            <K.LayerCard>Card content</K.LayerCard>
          </div>
          <div data-probe="Surface">
            <K.Surface>Legacy surface</K.Surface>
          </div>
          <div data-probe="Grid">
            <K.Grid variant="2up">
              <K.GridItem>First</K.GridItem>
              <K.GridItem>Second</K.GridItem>
            </K.Grid>
          </div>
          <div data-probe="CloudflareLogo">
            <K.CloudflareLogo
              variant="glyph"
              style={{ width: 32, height: 32 }}
            />
          </div>
          <div data-probe="PoweredByCloudflare">
            <K.PoweredByCloudflare />
          </div>
          <div data-probe="Loader">
            <K.Loader />
          </div>
          <div data-probe="SkeletonLine">
            <K.SkeletonLine minWidth={60} maxWidth={60} />
          </div>
          <div data-probe="Meter">
            <K.Meter label="Requests" value={40} />
          </div>
          <div data-probe="Empty">
            <K.Empty
              title="No Workers"
              description="Create a Worker to get started."
            />
          </div>
        </>
      )}
      {scenario === "forms" && (
        <>
          <div data-probe="Input">
            <K.Input
              label="Worker name"
              value={value}
              onValueChange={setValue}
              render={<input data-composed="input" />}
            />
          </div>
          <div data-probe="Input-error">
            <K.Input
              label="Email"
              error="Invalid address"
              defaultValue="invalid"
            />
          </div>
          <div data-probe="InputArea">
            <K.InputArea label="Notes" defaultValue="Deployment notes" />
          </div>
          <div data-probe="Textarea">
            <K.Textarea aria-label="Legacy notes" defaultValue="Notes" />
          </div>
          <div data-probe="InputGroup">
            <K.InputGroup label="Subdomain">
              <K.InputGroup.Addon>@</K.InputGroup.Addon>
              <K.InputGroup.Input
                defaultValue="api"
                render={(props) => (
                  <input {...props} data-composed="group-input" />
                )}
              />
              <K.InputGroup.Suffix>.workers.dev</K.InputGroup.Suffix>
            </K.InputGroup>
          </div>
          <div data-probe="SensitiveInput">
            <K.SensitiveInput label="API token" defaultValue="test-token" />
          </div>
          <div data-probe="Checkbox">
            <K.Checkbox
              label="Notify"
              checked={checked}
              onCheckedChange={setChecked}
            />
          </div>
          <div data-probe="Switch">
            <K.Switch label="Enabled" />
          </div>
          <div data-probe="Radio">
            <K.Radio.Group legend="Mode" defaultValue="auto">
              <K.Radio.Item value="auto" label="Automatic" />
              <K.Radio.Item value="manual" label="Manual" />
            </K.Radio.Group>
          </div>
          <div data-probe="Field">
            <K.Field label="Field input" description="Help text">
              <K.Input />
            </K.Field>
          </div>
        </>
      )}
      {scenario === "selection" && (
        <>
          <div data-probe="Select">
            <K.Select
              label="Environment"
              defaultValue="production"
              items={{ production: "Production", staging: "Staging" }}
              onValueChange={(item) => setSelected(String(item))}
            />
          </div>
          <div data-probe="Autocomplete">
            <K.Autocomplete
              items={["Argentina", "Brazil", "Canada"]}
              label="Country"
              onValueChange={setValue}
            >
              <K.Autocomplete.InputGroup placeholder="Search countries" />
              <K.Autocomplete.Content>
                <K.Autocomplete.List>
                  {(item: string) => (
                    <K.Autocomplete.Item value={item}>
                      {item}
                    </K.Autocomplete.Item>
                  )}
                </K.Autocomplete.List>
              </K.Autocomplete.Content>
            </K.Autocomplete>
          </div>
          <div data-probe="Combobox">
            <K.Combobox
              items={["English", "French", "German"]}
              label="Language"
              onValueChange={(item) => setSelected(String(item))}
            >
              <K.Combobox.TriggerInput placeholder="Search languages" />
              <K.Combobox.Content>
                <K.Combobox.List>
                  {(item: string) => (
                    <K.Combobox.Item value={item}>{item}</K.Combobox.Item>
                  )}
                </K.Combobox.List>
              </K.Combobox.Content>
            </K.Combobox>
          </div>
        </>
      )}
      {scenario === "navigation" && (
        <>
          <div data-probe="Tabs">
            <K.Tabs
              selectedValue={selected === "none" ? "overview" : selected}
              onValueChange={setSelected}
              tabs={[
                { value: "overview", label: "Overview" },
                { value: "analytics", label: "Analytics" },
              ]}
            />
          </div>
          <div data-probe="Toolbar">
            <K.Toolbar aria-label="Tools">
              <K.Toolbar.Button onClick={() => setSelected("tool")}>
                First tool
              </K.Toolbar.Button>
              <K.Toolbar.Button disabled>Disabled tool</K.Toolbar.Button>
              <K.Toolbar.Button>Last tool</K.Toolbar.Button>
            </K.Toolbar>
          </div>
          <div data-probe="MenuBar">
            <K.MenuBar
              isActive={0}
              options={[
                {
                  icon: <span>A</span>,
                  tooltip: "First view",
                  onClick: () => setSelected("first"),
                },
                {
                  icon: <span>B</span>,
                  tooltip: "Second view",
                  onClick: () => setSelected("second"),
                },
              ]}
            />
          </div>
          <div data-probe="Collapsible">
            <K.Collapsible.Root>
              <K.Collapsible.DefaultTrigger>
                Details
              </K.Collapsible.DefaultTrigger>
              <K.Collapsible.DefaultPanel>
                Deployment details
              </K.Collapsible.DefaultPanel>
            </K.Collapsible.Root>
          </div>
        </>
      )}
      {scenario === "overlays" && (
        <>
          <div data-probe="Dialog">
            <K.Dialog.Root>
              <K.Dialog.Trigger render={<K.Button />}>
                Open dialog
              </K.Dialog.Trigger>
              <K.Dialog>
                <K.Dialog.Title>Review deployment</K.Dialog.Title>
                <K.Dialog.Description>
                  Confirm this deployment.
                </K.Dialog.Description>
                <K.Dialog.Close render={<K.Button />}>
                  Close dialog
                </K.Dialog.Close>
              </K.Dialog>
            </K.Dialog.Root>
          </div>
          <div data-probe="Popover">
            <K.Popover>
              <K.Popover.Trigger render={<K.Button />}>
                Open popover
              </K.Popover.Trigger>
              <K.Popover.Content>
                <K.Popover.Title>Status</K.Popover.Title>
                <K.Popover.Description>Healthy</K.Popover.Description>
              </K.Popover.Content>
            </K.Popover>
          </div>
          <div data-probe="DropdownMenu">
            <K.DropdownMenu>
              <K.DropdownMenu.Trigger>
                <K.Button>Open menu</K.Button>
              </K.DropdownMenu.Trigger>
              <K.DropdownMenu.Content>
                <K.DropdownMenu.Item onClick={() => setSelected("menu")}>
                  Menu action
                </K.DropdownMenu.Item>
                <K.DropdownMenu.Item disabled>Unavailable</K.DropdownMenu.Item>
              </K.DropdownMenu.Content>
            </K.DropdownMenu>
          </div>
          <div data-probe="Tooltip">
            <K.Tooltip
              content="Tooltip content"
              delay={0}
              render={<K.Button />}
            >
              Tooltip trigger
            </K.Tooltip>
          </div>
        </>
      )}
      {scenario === "table" && (
        <>
          <div data-probe="Table">
            <K.Table aria-label="Resources">
              <K.Table.Header>
                <K.Table.Row>
                  <K.Table.Head>Name</K.Table.Head>
                  <K.Table.Head>Status</K.Table.Head>
                </K.Table.Row>
              </K.Table.Header>
              <K.Table.Body>
                <K.Table.Row>
                  <K.Table.Cell>Worker {page}</K.Table.Cell>
                  <K.Table.Cell>Active</K.Table.Cell>
                </K.Table.Row>
              </K.Table.Body>
            </K.Table>
          </div>
          <div data-probe="Pagination">
            <K.Pagination
              page={page}
              setPage={setPage}
              perPage={10}
              totalCount={35}
            >
              <K.Pagination.Info />
              <K.Pagination.Controls />
            </K.Pagination>
          </div>
        </>
      )}
      {scenario === "delete" && (
        <>
          <K.Button onClick={() => setOpen(true)}>Open delete</K.Button>
          <K.DeleteResource
            open={open}
            onOpenChange={setOpen}
            resourceType="Worker"
            resourceName="edge-api"
            onDelete={() => setSelected("deleted")}
          />
        </>
      )}
      {scenario === "command" && (
        <>
          <K.Button onClick={() => setOpen(true)}>Open commands</K.Button>
          <K.CommandPalette.Root
            open={open}
            onOpenChange={setOpen}
            items={commands}
            value={value}
            onValueChange={setValue}
            getSelectableItems={(items) => items}
            onSelect={(item) => setSelected(`${item}:new-tab`)}
          >
            <K.CommandPalette.Input placeholder="Search commands" />
            <K.CommandPalette.List>
              <K.CommandPalette.Results<string>>
                {(item) => (
                  <K.CommandPalette.Item
                    value={item}
                    disabled={item === "Disabled"}
                    onClick={() => setSelected(item)}
                  >
                    {item}
                  </K.CommandPalette.Item>
                )}
              </K.CommandPalette.Results>
              <K.CommandPalette.Empty />
            </K.CommandPalette.List>
            <K.CommandPalette.Footer>Enter to select</K.CommandPalette.Footer>
          </K.CommandPalette.Root>
        </>
      )}
      {scenario === "flow" && (
        <>
          <K.Button onClick={() => setChecked(!checked)}>
            Toggle orientation
          </K.Button>
          <div data-probe="Flow">
            <K.Flow
              orientation={checked ? "vertical" : "horizontal"}
              align="center"
              className="h-96"
            >
              <K.Flow.Node id="start">Start</K.Flow.Node>
              <K.Flow.Parallel>
                <K.Flow.Node id="a">Validate</K.Flow.Node>
                <K.Flow.List>
                  <K.Flow.Node id="b">Transform</K.Flow.Node>
                  <K.Flow.Node id="c">Archive</K.Flow.Node>
                </K.Flow.List>
              </K.Flow.Parallel>
              <K.Flow.Node id="end">Complete</K.Flow.Node>
            </K.Flow>
          </div>
        </>
      )}
      {scenario === "date" && (
        <div data-probe="DatePicker">
          <K.DatePicker
            mode="single"
            defaultMonth={new Date(2024, 8, 1)}
            today={new Date(2024, 8, 5)}
            selected={date}
            onChange={setDate}
            disabled={new Date(2024, 8, 20)}
          />
        </div>
      )}
      {scenario === "legacy-date" && (
        <div data-probe="DateRangePicker">
          <K.DateRangePicker
            timezone="UTC"
            onStartDateChange={(item) => setSelected(String(item?.getDate()))}
            onEndDateChange={(item) => setValue(String(item?.getDate()))}
          />
        </div>
      )}
      {scenario === "feedback" && (
        <>
          <div data-probe="ClipboardText">
            <K.ClipboardText text="copy-me" />
          </div>
          <K.Toasty>
            <ToastFixture />
          </K.Toasty>
        </>
      )}
      {scenario === "code" && (
        <>
          <div data-probe="Code">
            <K.Code code={'const value = "<safe>";'} />
          </div>
          <div data-probe="CodeBlock">
            <K.CodeBlock code="pnpm add kumo" lang="bash" />
          </div>
          <ShikiProvider engine="javascript" languages={["ts"]}>
            <div data-probe="CodeHighlighted">
              <CodeHighlighted
                code={'const value = "<safe>";'}
                lang="ts"
                showCopyButton
              />
            </div>
          </ShikiProvider>
        </>
      )}
      {scenario === "shell" && (
        <>
          <div data-probe="Sidebar">
            <K.Sidebar.Provider defaultOpen onOpenChange={setChecked}>
              <K.Sidebar>
                <K.Sidebar.Header>Account</K.Sidebar.Header>
                <K.Sidebar.Content>
                  <K.Sidebar.Group>
                    <K.Sidebar.GroupLabel>Resources</K.Sidebar.GroupLabel>
                    <K.Sidebar.Menu>
                      <K.Sidebar.MenuButton
                        active
                        onClick={() => setSelected("workers")}
                      >
                        Workers
                      </K.Sidebar.MenuButton>
                    </K.Sidebar.Menu>
                  </K.Sidebar.Group>
                </K.Sidebar.Content>
                <K.Sidebar.Footer>
                  <K.Sidebar.Trigger />
                </K.Sidebar.Footer>
              </K.Sidebar>
              <K.Sidebar.Trigger aria-label="Toggle navigation" />
            </K.Sidebar.Provider>
          </div>
          <div data-probe="TableOfContents">
            <K.TableOfContents>
              <K.TableOfContents.Title>On this page</K.TableOfContents.Title>
              <K.TableOfContents.List>
                <K.TableOfContents.Item href="#intro" active>
                  Introduction
                </K.TableOfContents.Item>
                <K.TableOfContents.Item href="#details">
                  Details
                </K.TableOfContents.Item>
              </K.TableOfContents.List>
            </K.TableOfContents>
          </div>
        </>
      )}
      <output data-result="true">
        {JSON.stringify({
          value,
          checked,
          selected,
          page,
          date: date?.getDate(),
        })}
      </output>
    </main>
  );
}
function ToastFixture() {
  const manager = K.useKumoToastManager();
  return (
    <K.Button
      onClick={() =>
        manager.add({
          title: "Saved",
          description: "Deployment saved",
          variant: "success",
          timeout: 0,
        })
      }
    >
      Show toast
    </K.Button>
  );
}
createRoot(document.getElementById("app")!).render(<Fixture />);
