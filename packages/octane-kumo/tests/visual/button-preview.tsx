/** @jsxImportSource octane */
import { createRoot } from "octane";
import {
  Button,
  LinkButton,
  RefreshButton,
} from "../../src/components/button/button";
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

function Preview() {
  return (
    <main className={cn("preview")}>
      <section className={cn("mode")} data-mode="light">
        <h2>Light</h2>
        <ButtonRows mode="Light" />
      </section>
      <section className={cn("mode")} data-mode="dark">
        <h2>Dark</h2>
        <ButtonRows mode="Dark" />
      </section>
    </main>
  );
}

const container = document.querySelector("#app");

if (!container) throw new Error("Missing preview root");

createRoot(container).render(<Preview />);
