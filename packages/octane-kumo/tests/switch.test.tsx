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
import { Switch } from "../src/components/switch/switch";

afterEach(cleanup);

describe("Switch", () => {
  it("toggles once from either its control or visible label", async () => {
    const values: boolean[] = [];
    const ref: { current: HTMLButtonElement | null } = { current: null };
    render(Switch, {
      props: {
        label: "Email notifications",
        onCheckedChange: (checked: boolean) => values.push(checked),
        ref,
      },
    });

    const control = screen.getByRole("switch", {
      name: "Email notifications",
    });
    expect(ref.current).toBe(control);
    expect(control.getAttribute("aria-checked")).toBe("false");

    await act(async () => {
      fireEvent.click(screen.getByText("Email notifications"));
      await Promise.resolve();
    });
    expect(values).toEqual([true]);
    expect(control.getAttribute("aria-checked")).toBe("true");

    await act(async () => {
      fireEvent.click(control);
      await Promise.resolve();
    });
    expect(values).toEqual([true, false]);
    expect(control.getAttribute("aria-checked")).toBe("false");
  });

  it("preserves controlled state and exposes transitioning", async () => {
    let nextValue: boolean | undefined;
    const { rerender } = render(Switch, {
      props: {
        "aria-label": "Automatic updates",
        checked: false,
        onCheckedChange: (checked: boolean) => {
          nextValue = checked;
        },
        transitioning: true,
      },
    });
    const control = screen.getByRole("switch", {
      name: "Automatic updates",
    });

    await act(async () => {
      fireEvent.click(control);
      await Promise.resolve();
    });
    expect(nextValue).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("false");
    expect(control.getAttribute("aria-busy")).toBe("true");

    rerender({
      props: {
        "aria-label": "Automatic updates",
        checked: true,
      },
    });
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(control.hasAttribute("aria-busy")).toBe(false);
  });

  it("supports native form values and disabled or read-only states", async () => {
    const values: boolean[] = [];

    function FormFixture() {
      return (
        <form data-testid="preferences-form">
          <Switch aria-label="Digest" defaultChecked name="digest" value={7} />
          <Switch
            aria-label="Locked"
            defaultChecked
            name="locked"
            onCheckedChange={(checked: boolean) => values.push(checked)}
            readOnly
            value="yes"
          />
          <Switch aria-label="Unavailable" disabled />
        </form>
      );
    }

    render(FormFixture);
    const form = screen.getByTestId("preferences-form") as HTMLFormElement;
    const locked = screen.getByRole("switch", { name: "Locked" });
    const unavailable = screen.getByRole("switch", { name: "Unavailable" });
    expect(new FormData(form).get("digest")).toBe("7");
    expect(
      screen.getByRole("switch", { name: "Digest" }).getAttribute("value"),
    ).toBe("7");
    expect(new FormData(form).get("locked")).toBe("yes");
    expect(locked.getAttribute("aria-readonly")).toBe("true");
    expect(unavailable.hasAttribute("disabled")).toBe(true);

    await act(async () => {
      fireEvent.click(locked);
      fireEvent.click(unavailable);
      await Promise.resolve();
    });
    expect(values).toEqual([]);
    expect(locked.getAttribute("aria-checked")).toBe("true");
  });
});

describe("Switch.Group", () => {
  it("provides a named group, composable legend, and inherited layout", async () => {
    const values: boolean[] = [];

    function GroupFixture() {
      return (
        <Switch.Group
          controlFirst={false}
          description="Choose the events to receive"
        >
          <Switch.Legend>Notification settings</Switch.Legend>
          <Switch.Item
            label="Deployments"
            onCheckedChange={(checked: boolean) => values.push(checked)}
          />
          <Switch.Item label="Incidents" />
        </Switch.Group>
      );
    }

    render(GroupFixture);
    expect(
      screen.getByRole("group", { name: "Notification settings" }),
    ).toBeTruthy();
    expect(screen.getByText("Choose the events to receive")).toBeTruthy();
    const deployments = screen.getByRole("switch", { name: "Deployments" });
    expect(deployments.getAttribute("data-kumo-part")).toBe("item");
    expect(
      deployments
        .closest('[data-kumo-part="item-label"]')
        ?.classList.contains("flex-row-reverse"),
    ).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByText("Deployments"));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(values).toEqual([true]);
      expect(deployments.getAttribute("aria-checked")).toBe("true");
    });
  });

  it("propagates disabled state and renders error before description", () => {
    function GroupStatesFixture() {
      return (
        <Switch.Group
          description="Choose at least one"
          disabled
          error="A notification is required"
          legend="Notifications"
        >
          <Switch.Item label="Email" />
        </Switch.Group>
      );
    }

    render(GroupStatesFixture);
    const control = screen.getByRole("switch", { name: "Email" });
    expect(control.hasAttribute("disabled")).toBe(true);
    expect(
      control
        .closest('[data-kumo-part="item-label"]')
        ?.classList.contains("opacity-50"),
    ).toBe(true);
    expect(screen.getByText("A notification is required")).toBeTruthy();
    expect(screen.getByText("Choose at least one")).toBeTruthy();
  });
});
