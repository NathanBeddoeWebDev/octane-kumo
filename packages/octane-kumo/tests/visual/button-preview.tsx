/** @jsxImportSource octane */
import { Info, Package } from "@octanejs/phosphor-icons";
import { createRoot } from "octane";
import { Badge } from "../../src/components/badge/badge";
import {
  Button,
  LinkButton,
  RefreshButton,
} from "../../src/components/button/button";
import { Checkbox } from "../../src/components/checkbox/checkbox";
import { Collapsible } from "../../src/components/collapsible/collapsible";
import { Empty } from "../../src/components/empty/empty";
import { InputArea } from "../../src/components/input/input-area";
import { Input } from "../../src/components/input/input";
import { InputGroup } from "../../src/components/input-group/input-group";
import { SkeletonLine } from "../../src/components/loader/skeleton-line";
import { Meter } from "../../src/components/meter/meter";
import { Radio } from "../../src/components/radio/radio";
import { SensitiveInput } from "../../src/components/sensitive-input/sensitive-input";
import { Switch } from "../../src/components/switch/switch";
import { Tooltip } from "../../src/components/tooltip/tooltip";
import { cn } from "../../src/utils/cn";

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
    <main className={cn("preview")}>
      <section className={cn("mode")} data-mode="light">
        <h2>Light</h2>
        <ButtonRows mode="Light" />
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
        <h3>Form controls</h3>
        <FormRows />
        <div className={cn("status-preview")}>
          <h3>Status and disclosure</h3>
          <StatusRows />
        </div>
      </section>
    </main>
  );
}

const container = document.querySelector("#app");

if (!container) throw new Error("Missing preview root");

createRoot(container).render(<Preview />);
