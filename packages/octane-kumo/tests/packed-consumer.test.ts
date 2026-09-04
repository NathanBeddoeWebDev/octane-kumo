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
        "@octanejs/base-ui",
        "@octanejs/phosphor-icons",
        "cnfast",
        "octane",
      ]) {
        linkDependency(consumerModules, dependency);
      }

      writeFileSync(
        resolve(consumerDirectory, "consumer.tsx"),
        `/** @jsxImportSource octane */
import {
  Button,
  Checkbox,
  Field,
  Input,
  InputArea,
  InputGroup,
  Label,
  Radio,
  RadioGroup,
  SensitiveInput,
  Switch,
  Textarea,
  Tooltip,
} from "octane-kumo";
import { Checkbox as CheckboxSubpath } from "octane-kumo/components/checkbox";
import { Field as FieldSubpath } from "octane-kumo/components/field";
import {
  Input as InputSubpath,
  InputArea as InputAreaSubpath,
  Textarea as TextareaSubpath,
} from "octane-kumo/components/input";
import { InputGroup as InputGroupSubpath } from "octane-kumo/components/input-group";
import { Label as LabelSubpath } from "octane-kumo/components/label";
import { Radio as RadioSubpath } from "octane-kumo/components/radio";
import { SensitiveInput as SensitiveInputSubpath } from "octane-kumo/components/sensitive-input";
import { Switch as SwitchSubpath } from "octane-kumo/components/switch";

const inputRef: { current: HTMLInputElement | null } = { current: null };
const inputAreaRef: { current: HTMLTextAreaElement | null } = { current: null };
const checkboxRef: { current: HTMLButtonElement | null } = { current: null };
void [
  CheckboxSubpath,
  FieldSubpath,
  InputSubpath,
  InputAreaSubpath,
  InputGroupSubpath,
  LabelSubpath,
  RadioSubpath,
  SensitiveInputSubpath,
  SwitchSubpath,
  TextareaSubpath,
];

export const consumerView = (
  <div>
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
        { stdio: "pipe" },
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
