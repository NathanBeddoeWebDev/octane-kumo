/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Button } from "../src/components/button/button";
import {
  Collapsible,
  type CollapsibleOpenChangeDetails,
} from "../src/components/collapsible/collapsible";

afterEach(cleanup);

describe("Collapsible", () => {
  it("exposes the complete compound API", () => {
    expect(Collapsible.Root).toBe(Collapsible);
    expect(typeof Collapsible.Trigger).toBe("function");
    expect(typeof Collapsible.Panel).toBe("function");
    expect(typeof Collapsible.DefaultTrigger).toBe("function");
    expect(typeof Collapsible.DefaultPanel).toBe("function");
  });

  it("toggles uncontrolled content with native change details", async () => {
    const changes: boolean[] = [];
    let details: CollapsibleOpenChangeDetails | undefined;

    function Fixture() {
      return (
        <Collapsible.Root
          onOpenChange={(open, eventDetails) => {
            changes.push(open);
            details = eventDetails;
          }}
        >
          <Collapsible.Trigger>Toggle details</Collapsible.Trigger>
          <Collapsible.Panel>Hidden details</Collapsible.Panel>
        </Collapsible.Root>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Toggle details" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Hidden details")).toBeNull();

    await act(async () => {
      fireEvent.click(trigger);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Hidden details")).toBeTruthy();
    });
    expect(changes).toEqual([true]);
    expect(details?.event).toBeInstanceOf(Event);
    expect(details?.reason).toBe("trigger-press");
  });

  it("preserves controlled state until the owner updates it", async () => {
    let requested = false;

    function Fixture({ open }: { open: boolean }) {
      return (
        <Collapsible.Root
          onOpenChange={(nextOpen) => {
            requested = nextOpen;
          }}
          open={open}
        >
          <Collapsible.Trigger>Controlled trigger</Collapsible.Trigger>
          <Collapsible.Panel>Controlled content</Collapsible.Panel>
        </Collapsible.Root>
      );
    }

    const { rerender } = render(Fixture, { props: { open: false } });
    const trigger = screen.getByRole("button", { name: "Controlled trigger" });
    await act(async () => {
      fireEvent.click(trigger);
      await Promise.resolve();
    });
    expect(requested).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Controlled content")).toBeNull();

    rerender({ props: { open: true } });
    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Controlled content")).toBeTruthy();
    });
  });

  it("supports styled defaults, disabled state, keepMounted, and refs", () => {
    const triggerRef: { current: HTMLButtonElement | null } = { current: null };
    const panelRef: { current: HTMLDivElement | null } = { current: null };

    function Fixture() {
      return (
        <Collapsible.Root disabled>
          <Collapsible.DefaultTrigger
            className="custom-trigger"
            ref={triggerRef}
          >
            More information
          </Collapsible.DefaultTrigger>
          <Collapsible.DefaultPanel keepMounted ref={panelRef}>
            Persistent content
          </Collapsible.DefaultPanel>
        </Collapsible.Root>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "More information" });
    const panel = screen.getByText("Persistent content").closest("div")!;
    expect(triggerRef.current).toBe(trigger);
    expect(panelRef.current).toBe(panel.parentElement);
    expect(trigger.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.classList.contains("custom-trigger")).toBe(true);
    expect(panel.parentElement?.hasAttribute("hidden")).toBe(true);
    expect(panel.parentElement?.classList.contains("overflow-hidden")).toBe(
      true,
    );
  });

  it("composes a custom Kumo button trigger and state class", () => {
    function Fixture() {
      return (
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger
            className={(state) => (state.open ? "is-open" : "is-closed")}
            render={<Button variant="secondary" />}
          >
            Composed trigger
          </Collapsible.Trigger>
          <Collapsible.Panel>Composed content</Collapsible.Panel>
        </Collapsible.Root>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Composed trigger" });
    expect(trigger.getAttribute("data-kumo-component")).toBe("Collapsible");
    expect(trigger.classList.contains("is-open")).toBe(true);
    expect(trigger.classList.contains("cursor-pointer")).toBe(true);
    expect(trigger.classList.contains("ring-kumo-line")).toBe(true);
  });
});
