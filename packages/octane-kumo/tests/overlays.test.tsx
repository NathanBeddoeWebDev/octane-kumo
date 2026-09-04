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
import { Dialog, KUMO_DIALOG_STYLING } from "../src/components/dialog/dialog";
import { DropdownMenu } from "../src/components/dropdown/dropdown";
import { Popover } from "../src/components/popover/popover";
import { KumoPortalProvider } from "../src/utils/portal-provider";

afterEach(cleanup);

describe("Dialog", () => {
  it("preserves React Kumo's exported styling metadata", () => {
    expect(KUMO_DIALOG_STYLING).toEqual({
      dimensions: {
        sm: {
          width: 350,
          titleSize: 20,
          descSize: 16,
          padding: 16,
          gap: 8,
          buttonSize: "sm",
        },
        base: {
          width: 384,
          titleSize: 20,
          descSize: 16,
          padding: 24,
          gap: 16,
          buttonSize: "base",
        },
        lg: {
          width: 512,
          titleSize: 20,
          descSize: 16,
          padding: 24,
          gap: 16,
          buttonSize: "base",
        },
        xl: {
          width: 768,
          titleSize: 20,
          descSize: 16,
          padding: 24,
          gap: 16,
          buttonSize: "base",
        },
      },
      baseTokens: {
        background: "color-surface",
        text: "text-color-surface",
        borderRadius: 12,
        shadow: "shadow-m",
      },
      backdrop: { background: "color-surface-secondary", opacity: 0.8 },
      header: {
        title: { fontWeight: 600, color: "text-color-surface" },
        closeIcon: {
          name: "ph-x",
          size: 20,
          color: "text-color-muted",
        },
      },
      description: { fontWeight: 400, color: "text-color-muted" },
      buttons: {
        primary: { background: "color-primary", text: "white" },
        secondary: { ring: "color-border", text: "text-color-surface" },
      },
    });
  });

  it("opens, exposes its accessible relationships, and restores focus", async () => {
    function Fixture() {
      return (
        <Dialog.Root>
          <Dialog.Trigger render={<Button />}>Open settings</Dialog.Trigger>
          <Dialog className="p-6" size="lg">
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Update account settings.</Dialog.Description>
            <Dialog.Close>Done</Dialog.Close>
          </Dialog>
        </Dialog.Root>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open settings" });
    fireEvent.click(trigger);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog", { name: "Settings" });
      expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
      expect(dialog.classList.contains("sm:w-[32rem]")).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("uses alert-dialog behavior and a provider portal", async () => {
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);

    try {
      function Fixture() {
        return (
          <KumoPortalProvider container={portalContainer}>
            <Dialog.Root role="alertdialog" defaultOpen>
              <Dialog>
                <Dialog.Title>Delete project?</Dialog.Title>
                <Dialog.Description>This cannot be undone.</Dialog.Description>
                <Dialog.Close>Cancel</Dialog.Close>
              </Dialog>
            </Dialog.Root>
          </KumoPortalProvider>
        );
      }

      render(Fixture);
      await waitFor(() => {
        expect(
          screen.getByRole("alertdialog", { name: "Delete project?" }),
        ).toBeTruthy();
        expect(portalContainer.textContent).toContain("This cannot be undone.");
      });
    } finally {
      portalContainer.remove();
    }
  });

  it("preserves controlled state and native change details", async () => {
    let requestedOpen = false;
    let reason: string | undefined;

    function Fixture({ open }: { open: boolean }) {
      return (
        <Dialog.Root
          open={open}
          onOpenChange={(nextOpen, details) => {
            requestedOpen = nextOpen;
            reason = details.reason;
          }}
        >
          <Dialog.Trigger>Controlled dialog</Dialog.Trigger>
          <Dialog>
            <Dialog.Title>Controlled title</Dialog.Title>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog>
        </Dialog.Root>
      );
    }

    const { rerender } = render(Fixture, { props: { open: false } });
    fireEvent.click(screen.getByRole("button", { name: "Controlled dialog" }));
    expect(requestedOpen).toBe(true);
    expect(reason).toBe("trigger-press");
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender({ props: { open: true } });
    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Controlled title" }),
      ).toBeTruthy();
    });
  });
});

describe("Popover", () => {
  it("opens from a composed trigger and closes on Escape", async () => {
    function Fixture() {
      return (
        <Popover>
          <Popover.Trigger render={<Button />}>Show details</Popover.Trigger>
          <Popover.Content side="right" align="start">
            <Popover.Title>Deployment details</Popover.Title>
            <Popover.Description>Healthy in every region.</Popover.Description>
          </Popover.Content>
        </Popover>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Show details" });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Deployment details" }),
      ).toBeTruthy();
      expect(screen.getByText("Healthy in every region.")).toBeTruthy();
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("supports asChild and a custom portal container", async () => {
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);

    try {
      function Fixture() {
        return (
          <KumoPortalProvider container={portalContainer}>
            <Popover>
              <Popover.Trigger asChild>
                <Button>Portaled popover</Button>
              </Popover.Trigger>
              <Popover.Content>
                <Popover.Title>Portaled title</Popover.Title>
                <Popover.Close>Dismiss</Popover.Close>
              </Popover.Content>
            </Popover>
          </KumoPortalProvider>
        );
      }

      render(Fixture);
      fireEvent.click(screen.getByRole("button", { name: "Portaled popover" }));
      await waitFor(() => {
        expect(portalContainer.textContent).toContain("Portaled title");
      });
      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      await waitFor(() => {
        expect(screen.queryByText("Portaled title")).toBeNull();
      });
    } finally {
      portalContainer.remove();
    }
  });
});

describe("DropdownMenu", () => {
  it("composes its trigger, roves focus, invokes an item, and closes", async () => {
    const selected: string[] = [];
    function Fixture() {
      return (
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <Button>Actions</Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={() => selected.push("edit")}>
              Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger.querySelector("button")).toBeNull();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeTruthy();
      expect(document.activeElement?.textContent).toContain("Edit");
    });

    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toContain("Duplicate");
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(selected).toEqual(["edit"]);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("supports checkbox, radio, links, and nested submenus", async () => {
    const checks: boolean[] = [];
    const radios: unknown[] = [];
    function Fixture() {
      return (
        <DropdownMenu>
          <DropdownMenu.Trigger>Preferences</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Group>
              <DropdownMenu.Label>Options</DropdownMenu.Label>
              <DropdownMenu.CheckboxItem
                defaultChecked
                onCheckedChange={(checked) => checks.push(checked)}
              >
                Notifications
              </DropdownMenu.CheckboxItem>
            </DropdownMenu.Group>
            <DropdownMenu.RadioGroup
              defaultValue="comfortable"
              onValueChange={(value) => radios.push(value)}
            >
              <DropdownMenu.RadioItem value="compact">
                Compact
                <DropdownMenu.RadioItemIndicator />
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="comfortable">
                Comfortable
                <DropdownMenu.RadioItemIndicator />
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
            <DropdownMenu.LinkItem href="/settings">
              Settings
            </DropdownMenu.LinkItem>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item>Nested action</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu>
      );
    }

    render(Fixture);
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeTruthy());

    const checkbox = screen.getByRole("menuitemcheckbox", {
      name: "Notifications",
    });
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(checkbox);
    expect(checks).toEqual([false]);

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Compact" }));
    expect(radios).toEqual(["compact"]);
    expect(
      screen
        .getByRole("menuitemradio", { name: "Compact" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByRole("menuitem", { name: "Settings" }).tagName).toBe(
      "A",
    );

    const submenuTrigger = screen.getByRole("menuitem", { name: "More" });
    await act(async () => {
      submenuTrigger.focus();
      fireEvent.keyDown(submenuTrigger, { key: "ArrowRight" });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Nested action" }),
      ).toBeTruthy();
    });
  });
});
