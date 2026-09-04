/** @jsxImportSource octane */
import { Info, Package } from "@octanejs/phosphor-icons";
import { createRoot, useRef } from "octane";
import { Badge } from "../../src/components/badge/badge";
import { Banner } from "../../src/components/banner/banner";
import { Breadcrumbs } from "../../src/components/breadcrumbs";
import {
  Button,
  LinkButton,
  RefreshButton,
} from "../../src/components/button/button";
import { Checkbox } from "../../src/components/checkbox/checkbox";
import { CloudflareLogo } from "../../src/components/cloudflare-logo/cloudflare-logo";
import { Collapsible } from "../../src/components/collapsible/collapsible";
import { Dialog } from "../../src/components/dialog/dialog";
import { DropdownMenu } from "../../src/components/dropdown/dropdown";
import { Empty } from "../../src/components/empty/empty";
import { InputArea } from "../../src/components/input/input-area";
import { Input } from "../../src/components/input/input";
import { InputGroup } from "../../src/components/input-group/input-group";
import { SkeletonLine } from "../../src/components/loader/skeleton-line";
import { Meter } from "../../src/components/meter/meter";
import { MenuBar } from "../../src/components/menubar/menubar";
import { Popover } from "../../src/components/popover/popover";
import { Radio } from "../../src/components/radio/radio";
import { SensitiveInput } from "../../src/components/sensitive-input/sensitive-input";
import { Sidebar } from "../../src/components/sidebar/sidebar";
import { Switch } from "../../src/components/switch/switch";
import { Tabs } from "../../src/components/tabs/tabs";
import { Text } from "../../src/components/text/text";
import { Tooltip } from "../../src/components/tooltip/tooltip";
import { Toolbar } from "../../src/components/toolbar/toolbar";
import { cn } from "../../src/utils/cn";
import { KumoPortalProvider } from "../../src/utils/portal-provider";

function ButtonRows({ mode }: { mode: "Light" | "Dark" }) {
  return (
    <>
      <div className={cn("row")}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className={cn("row")}>
        <Button variant="destructive">Delete</Button>
        <Button variant="secondary-destructive">Remove</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className={cn("row")}>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className={cn("row")}>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <RefreshButton title="Refresh" />
        <LinkButton href="https://example.com">Link button</LinkButton>
      </div>
      <div className={cn("row")}>
        <Tooltip
          content={`${mode} tooltip content`}
          delay={0}
          render={<Button variant="secondary" />}
          side="bottom"
        >
          {mode} tooltip
        </Tooltip>
      </div>
    </>
  );
}

function OverlayRows({ mode }: { mode: "Light" | "Dark" }) {
  const portalContainer = useRef<HTMLDivElement | null>(null);

  return (
    <div className={cn("row")} ref={portalContainer}>
      <KumoPortalProvider container={portalContainer}>
        <Dialog.Root>
          <Dialog.Trigger render={<Button variant="secondary" />}>
            {mode} dialog
          </Dialog.Trigger>
          <Dialog className={cn("p-6")} size="lg">
            <Dialog.Title>Review deployment</Dialog.Title>
            <Dialog.Description className={cn("mt-2 text-kumo-subtle")}>
              Confirm the production rollout before continuing.
            </Dialog.Description>
            <div className={cn("mt-6 flex justify-end gap-3")}>
              <Dialog.Close render={<Button variant="secondary" />}>
                Cancel
              </Dialog.Close>
              <Dialog.Close render={<Button variant="primary" />}>
                Deploy
              </Dialog.Close>
            </div>
          </Dialog>
        </Dialog.Root>
        <Popover>
          <Popover.Trigger render={<Button variant="secondary" />}>
            {mode} popover
          </Popover.Trigger>
          <Popover.Content align="start">
            <Popover.Title>Deployment status</Popover.Title>
            <Popover.Description>Healthy in every region.</Popover.Description>
          </Popover.Content>
        </Popover>
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <Button variant="secondary">{mode} menu</Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start">
            <DropdownMenu.Group>
              <DropdownMenu.Label>Deployment</DropdownMenu.Label>
              <DropdownMenu.Item>View details</DropdownMenu.Item>
              <DropdownMenu.CheckboxItem defaultChecked>
                Automatic rollback
              </DropdownMenu.CheckboxItem>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item variant="danger">
              Delete deployment
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </KumoPortalProvider>
    </div>
  );
}

function NavigationRows() {
  return (
    <>
      <Tabs
        selectedValue="overview"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "analytics", label: "Analytics" },
          { value: "settings", label: "Settings" },
        ]}
      />
      <Tabs
        selectedValue="workers"
        size="sm"
        tabs={[
          { value: "workers", label: "Workers" },
          { value: "pages", label: "Pages" },
          { value: "storage", label: "Storage" },
        ]}
        variant="underline"
      />
      <div className={cn("row")}>
        <Toolbar aria-label="Deployment tools">
          <Toolbar.Button icon={Package}>Deploy</Toolbar.Button>
          <Toolbar.Input aria-label="Search deployments" placeholder="Search" />
          <Toolbar.Link href="#documentation">Documentation</Toolbar.Link>
        </Toolbar>
        <MenuBar
          isActive="details"
          optionIds
          options={[
            {
              id: "details",
              icon: <Info />,
              tooltip: "Details view",
              onClick: () => undefined,
            },
            {
              id: "packages",
              icon: <Package />,
              tooltip: "Packages view",
              onClick: () => undefined,
            },
          ]}
        />
      </div>
    </>
  );
}

function FormRows() {
  return (
    <>
      <div className={cn("form-grid")}>
        <Input label="Worker name" placeholder="api-worker" />
        <Input
          description="Choose a globally unique name"
          label="Hostname"
          placeholder="example.com"
        />
        <Input error="Enter a valid email" label="Email" value="invalid" />
        <Input disabled label="Disabled input" value="Unavailable" />
        <InputArea
          autoResize
          defaultValue={"Deploy on every push\nKeep the last ten versions"}
          description="Add deployment context"
          label="Notes"
          maxRows={4}
          minRows={2}
        />
        <InputArea error="A summary is required" label="Summary" />
        <InputGroup label="Subdomain">
          <InputGroup.Addon>@</InputGroup.Addon>
          <InputGroup.Input defaultValue="api" />
          <InputGroup.Suffix>.workers.dev</InputGroup.Suffix>
        </InputGroup>
        <InputGroup label="Search">
          <InputGroup.Addon>⌕</InputGroup.Addon>
          <InputGroup.Input defaultValue="workers" />
          <InputGroup.Button variant="secondary">Run</InputGroup.Button>
        </InputGroup>
        <InputGroup label="Page">
          <InputGroup.Input defaultValue="1" />
          <InputGroup.Button variant="secondary">Next</InputGroup.Button>
        </InputGroup>
        <SensitiveInput defaultValue="secret-api-key" label="API token" />
        <SensitiveInput error="Invalid secret" label="New secret" />
      </div>
      <div className={cn("checkbox-grid")}>
        <Checkbox label="Unchecked" />
        <Checkbox checked label="Checked" />
        <Checkbox indeterminate label="Indeterminate" />
        <Checkbox disabled label="Disabled" />
        <Checkbox label="Validation error" variant="error" />
        <Checkbox controlFirst={false} label="Label first" />
      </div>
      <Checkbox.Group
        defaultValue={["email"]}
        description="Choose every channel you want"
        legend="Notification channels"
      >
        <Checkbox.Item label="Email" value="email" />
        <Checkbox.Item label="SMS" value="sms" />
      </Checkbox.Group>
      <div className={cn("checkbox-grid")}>
        <Switch label="Small" size="sm" />
        <Switch checked label="Enabled" />
        <Switch checked label="Neutral" size="lg" variant="neutral" />
        <Switch disabled label="Disabled" />
        <Switch label="Label first" controlFirst={false} />
        <Switch label="Saving" transitioning />
      </div>
      <Switch.Group
        description="Choose the events to receive"
        legend="Alert types"
      >
        <Switch.Item defaultChecked label="Deployments" />
        <Switch.Item label="Incidents" variant="neutral" />
      </Switch.Group>
      <div className={cn("control-columns")}>
        <Radio.Group defaultValue="auto" legend="Deployment mode">
          <Radio.Item label="Automatic" value="auto" />
          <Radio.Item label="Manual" value="manual" />
          <Radio.Item disabled label="Scheduled" value="scheduled" />
        </Radio.Group>
        <Radio.Group
          defaultValue="production"
          error="Choose a target"
          legend="Target"
        >
          <Radio.Item label="Preview" value="preview" variant="error" />
          <Radio.Item label="Production" value="production" variant="error" />
        </Radio.Group>
      </div>
      <Radio.Group
        appearance="card"
        defaultValue="pro"
        legend="Plan"
        orientation="horizontal"
      >
        <Radio.Item
          description="For personal projects"
          label="Free"
          value="free"
        />
        <Radio.Item
          description="For production workloads"
          label="Pro"
          value="pro"
        />
      </Radio.Group>
    </>
  );
}

function StatusRows() {
  return (
    <>
      <div className={cn("row")}>
        <Badge>Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="success">Healthy</Badge>
        <Badge variant="warning">Degraded</Badge>
        <Badge variant="error">Failed</Badge>
        <Badge icon={Info} variant="info">
          Information
        </Badge>
        <Badge variant="beta">Beta</Badge>
      </div>
      <div className={cn("row")}>
        <Badge appearance="dot" variant="success">
          Operational
        </Badge>
        <Badge appearance="dot" variant="warning">
          Delayed
        </Badge>
        <Badge appearance="dot" variant="error">
          Outage
        </Badge>
        <Badge appearance="dot" variant="neutral">
          Unknown
        </Badge>
      </div>
      <div className={cn("status-grid")}>
        <div className={cn("status-stack")}>
          <Meter label="Daily requests" value={12} />
          <Meter
            customValue="651 MB of 1 GB"
            label="Storage"
            max={1024}
            value={651}
          />
          <Meter label="Deployment" value={100} />
        </div>
        <div className={cn("skeleton-card")}>
          <SkeletonLine maxWidth={45} minWidth={45} />
          <SkeletonLine maxWidth={95} minWidth={95} />
          <SkeletonLine blockHeight={40} maxWidth={72} minWidth={72} />
          <SkeletonLine maxWidth={58} minWidth={58} />
        </div>
      </div>
      <div className={cn("status-grid")}>
        <div className={cn("status-stack")}>
          <Collapsible.Root defaultOpen>
            <Collapsible.DefaultTrigger>
              Open deployment details
            </Collapsible.DefaultTrigger>
            <Collapsible.DefaultPanel>
              This deployment is serving traffic from 12 locations.
            </Collapsible.DefaultPanel>
          </Collapsible.Root>
          <Collapsible.Root>
            <Collapsible.DefaultTrigger>
              Closed deployment details
            </Collapsible.DefaultTrigger>
            <Collapsible.DefaultPanel>
              Details shown after opening the disclosure.
            </Collapsible.DefaultPanel>
          </Collapsible.Root>
        </div>
        <Collapsible.Root className={cn("composed-collapsible")} defaultOpen>
          <Collapsible.Trigger className={cn("composed-trigger")}>
            Composed trigger
          </Collapsible.Trigger>
          <Collapsible.Panel className={cn("composed-panel")}>
            A custom trigger and panel retain Base UI behavior.
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>
      <div className={cn("empty-grid")}>
        <Empty
          description="Create a Worker to begin serving requests."
          icon={
            <Package
              aria-hidden="true"
              className={cn("size-8 text-kumo-brand")}
            />
          }
          size="sm"
          title="No Workers yet"
        />
        <Empty
          commandLine="pnpm add octane-kumo"
          contents={<Button>Create Worker</Button>}
          description="Install the package or create your first Worker."
          title="Start building"
        />
      </div>
    </>
  );
}

function Preview() {
  return (
    <Sidebar.Provider defaultOpen>
      <Sidebar>
        <Sidebar.Header>
          <CloudflareLogo variant="glyph" className={cn("h-6 w-6 shrink-0")} />
          <Text variant="heading" truncate>
            Octane Kumo
          </Text>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Preview</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuButton active>Components</Sidebar.MenuButton>
              <Sidebar.MenuButton>Shell</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Layout</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuButton>Sidebar</Sidebar.MenuButton>
              <Sidebar.MenuButton>Breadcrumbs</Sidebar.MenuButton>
              <Sidebar.MenuButton>Banner</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <Sidebar.Trigger />
          <Text variant="secondary" size="sm" truncate>
            Toggle sidebar
          </Text>
        </Sidebar.Footer>
      </Sidebar>
      <div className={cn("shell-main")}>
        <header className={cn("shell-header")}>
          <Breadcrumbs>
            <Breadcrumbs.Link href="#">Preview</Breadcrumbs.Link>
            <Breadcrumbs.Separator />
            <Breadcrumbs.Current>Components</Breadcrumbs.Current>
          </Breadcrumbs>
          <Text variant="heading" as="h1" size="lg">
            Component preview
          </Text>
          <Text variant="secondary" size="sm">
            Shell chrome (sidebar, breadcrumbs, banner) wraps the existing
            light/dark matrix for testing.
          </Text>
        </header>
        <div className={cn("shell-banner")}>
          <Banner
            title="Shell testing mode"
            description="This banner, the sidebar, and the breadcrumbs above are the shell under test."
          />
        </div>
        <main className={cn("preview")}>
          <section className={cn("mode")} data-mode="light">
            <h2>Light</h2>
            <ButtonRows mode="Light" />
            <h3>Overlays</h3>
            <OverlayRows mode="Light" />
            <h3>Navigation</h3>
            <NavigationRows />
            <h3>Form controls</h3>
            <FormRows />
            <div className={cn("status-preview")}>
              <h3>Status and disclosure</h3>
              <StatusRows />
            </div>
          </section>
          <section className={cn("mode")} data-mode="dark">
            <h2>Dark</h2>
            <ButtonRows mode="Dark" />
            <h3>Overlays</h3>
            <OverlayRows mode="Dark" />
            <h3>Navigation</h3>
            <NavigationRows />
            <h3>Form controls</h3>
            <FormRows />
            <div className={cn("status-preview")}>
              <h3>Status and disclosure</h3>
              <StatusRows />
            </div>
          </section>
        </main>
      </div>
    </Sidebar.Provider>
  );
}

const container = document.querySelector("#app");

if (!container) throw new Error("Missing preview root");

createRoot(container).render(<Preview />);
