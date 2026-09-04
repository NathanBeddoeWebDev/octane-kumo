/** @jsxImportSource octane */
import { useState } from "octane";
import { Checkbox } from "../../src/components/checkbox/checkbox";
import { InputArea } from "../../src/components/input/input-area";
import { Input } from "../../src/components/input/input";
import { Radio } from "../../src/components/radio/radio";
import { Switch } from "../../src/components/switch/switch";

export function FormHydrationFixture() {
  const [name, setName] = useState("worker");
  const [notes, setNotes] = useState("Runs globally");
  const [enabled, setEnabled] = useState(false);
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [automaticDeploys, setAutomaticDeploys] = useState(false);
  const [region, setRegion] = useState("americas");

  return (
    <div>
      <Input
        label="Worker name"
        name="worker"
        onValueChange={setName}
        value={name}
      />
      <output data-testid="worker-value">{name}</output>
      <InputArea
        label="Notes"
        name="notes"
        onValueChange={setNotes}
        value={notes}
      />
      <output data-testid="notes-value">{notes}</output>
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
      <Switch
        checked={automaticDeploys}
        label="Automatic deploys"
        onCheckedChange={setAutomaticDeploys}
      />
      <output data-testid="deploys-value">{String(automaticDeploys)}</output>
      <Radio.Group legend="Region" onValueChange={setRegion} value={region}>
        <Radio.Item label="Americas" value="americas" />
        <Radio.Item label="Europe" value="europe" />
      </Radio.Group>
      <output data-testid="region-value">{region}</output>
    </div>
  );
}
