/** @jsxImportSource octane */
import { useState } from "octane";
import { Checkbox } from "../../src/components/checkbox/checkbox";
import { Input } from "../../src/components/input/input";

export function FormHydrationFixture() {
  const [name, setName] = useState("worker");
  const [enabled, setEnabled] = useState(false);
  const [channels, setChannels] = useState<string[]>(["email"]);

  return (
    <div>
      <Input
        label="Worker name"
        name="worker"
        onValueChange={setName}
        value={name}
      />
      <output data-testid="worker-value">{name}</output>
      <Checkbox
        checked={enabled}
        label="Enable logs"
        onCheckedChange={setEnabled}
      />
      <output data-testid="enabled-value">{String(enabled)}</output>
      <Checkbox.Group
        onValueChange={setChannels}
        value={channels}
        legend="Notification channels"
      >
        <Checkbox.Item label="Email" value="email" />
        <Checkbox.Item label="SMS" value="sms" />
      </Checkbox.Group>
      <output data-testid="channels-value">{channels.join(",")}</output>
    </div>
  );
}
