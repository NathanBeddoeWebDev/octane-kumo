/** @jsxImportSource octane */
import { createRoot } from "octane";
import {
  Button,
  LinkButton,
  RefreshButton,
} from "../../src/components/button/button";
import { Checkbox } from "../../src/components/checkbox/checkbox";
import { InputArea } from "../../src/components/input/input-area";
import { Input } from "../../src/components/input/input";
import { Radio } from "../../src/components/radio/radio";
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

function Preview() {
  return (
    <main className={cn("preview")}>
      <section className={cn("mode")} data-mode="light">
        <h2>Light</h2>
        <ButtonRows mode="Light" />
        <h3>Form controls</h3>
        <FormRows />
      </section>
      <section className={cn("mode")} data-mode="dark">
        <h2>Dark</h2>
        <ButtonRows mode="Dark" />
        <h3>Form controls</h3>
        <FormRows />
      </section>
    </main>
  );
}

const container = document.querySelector("#app");

if (!container) throw new Error("Missing preview root");

createRoot(container).render(<Preview />);
