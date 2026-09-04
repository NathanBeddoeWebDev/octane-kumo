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
import {
  Checkbox,
  type CheckboxChangeEventDetails,
} from "../src/components/checkbox/checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("toggles an uncontrolled labeled checkbox", async () => {
    const values: boolean[] = [];
    render(Checkbox, {
      props: {
        label: "Accept terms",
        onCheckedChange: (checked: boolean) => values.push(checked),
      },
    });

    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");

    await act(async () => {
      fireEvent.click(checkbox);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(values).toEqual([true]);
      expect(checkbox.getAttribute("aria-checked")).toBe("true");
    });
  });

  it("toggles once when its visible label is clicked", async () => {
    const values: boolean[] = [];
    render(Checkbox, {
      props: {
        label: "Email notifications",
        onCheckedChange: (checked: boolean) => values.push(checked),
      },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Email notifications"));
      await Promise.resolve();
    });

    expect(values).toEqual([true]);
    expect(
      screen
        .getByRole("checkbox", { name: "Email notifications" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("preserves controlled state and reports native change details", async () => {
    const ref: { current: HTMLButtonElement | null } = { current: null };
    let nextValue: boolean | undefined;
    let details: CheckboxChangeEventDetails | undefined;
    const { rerender } = render(Checkbox, {
      props: {
        "aria-label": "Select row",
        checked: false,
        name: "selected",
        onCheckedChange: (
          checked: boolean,
          eventDetails: CheckboxChangeEventDetails,
        ) => {
          nextValue = checked;
          details = eventDetails;
        },
        ref,
        value: "row-1",
      },
    });
    const checkbox = screen.getByRole("checkbox", { name: "Select row" });

    await act(async () => {
      fireEvent.click(checkbox);
      await Promise.resolve();
    });

    expect(nextValue).toBe(true);
    expect(details?.reason).toBe("none");
    expect(details?.event).toBeInstanceOf(Event);
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(ref.current).toBe(checkbox);

    rerender({
      props: {
        "aria-label": "Select row",
        checked: true,
        name: "selected",
        ref,
        value: "row-1",
      },
    });
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    const input = document.querySelector<HTMLInputElement>(
      'input[type="checkbox"][name="selected"]',
    );
    expect(input?.checked).toBe(true);
    expect(input?.value).toBe("row-1");
  });

  it("exposes indeterminate and disabled states", async () => {
    const onCheckedChange: boolean[] = [];
    render(Checkbox, {
      props: {
        "aria-label": "Select all",
        disabled: true,
        indeterminate: true,
        onCheckedChange: (checked: boolean) => onCheckedChange.push(checked),
      },
    });
    const checkbox = screen.getByRole("checkbox", { name: "Select all" });

    expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    expect(checkbox.hasAttribute("data-indeterminate")).toBe(true);
    expect(checkbox.hasAttribute("disabled")).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>('input[type="checkbox"]')
        ?.indeterminate,
    ).toBe(true);

    await act(async () => {
      fireEvent.click(checkbox);
      await Promise.resolve();
    });
    expect(onCheckedChange).toEqual([]);
  });

  it("submits its checked value with a native form", () => {
    function CheckboxFormFixture() {
      return (
        <form data-testid="preferences-form">
          <Checkbox
            aria-label="Email notifications"
            defaultChecked
            name="notifications"
            value="email"
          />
        </form>
      );
    }

    render(CheckboxFormFixture);

    const form = screen.getByTestId("preferences-form") as HTMLFormElement;
    expect(new FormData(form).getAll("notifications")).toEqual(["email"]);
  });
});

describe("Checkbox.Group", () => {
  it("manages item values and exposes a composable legend", async () => {
    const values: string[][] = [];

    function GroupFixture() {
      return (
        <Checkbox.Group
          defaultValue={["email"]}
          description="Choose every channel you want"
          onValueChange={(value: string[]) => values.push(value)}
        >
          <Checkbox.Legend>Notification channels</Checkbox.Legend>
          <Checkbox.Item label="Email" value="email" />
          <Checkbox.Item label="SMS" value="sms" />
        </Checkbox.Group>
      );
    }

    render(GroupFixture);

    expect(
      screen
        .getByRole("checkbox", { name: "Email" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("checkbox", { name: "SMS" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen.getByRole("group", { name: "Notification channels" }),
    ).toBeTruthy();
    expect(screen.getByText("Choose every channel you want")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("SMS"));
      await Promise.resolve();
    });

    expect(values).toEqual([["email", "sms"]]);
    expect(
      screen
        .getByRole("checkbox", { name: "SMS" })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("preserves group layout, disabled state, description, and error", () => {
    function GroupStatesFixture() {
      return (
        <Checkbox.Group
          controlFirst={false}
          description="Select at least one channel"
          disabled
          error="A channel is required"
          legend="Channels"
        >
          <Checkbox.Item disabled label="Email" value="email" />
          <Checkbox.Item label="SMS" value="sms" />
        </Checkbox.Group>
      );
    }

    render(GroupStatesFixture);

    const checkbox = screen.getByRole("checkbox", { name: "Email" });
    const inheritedDisabledCheckbox = screen.getByRole("checkbox", {
      name: "SMS",
    });
    const label = checkbox.closest('[data-kumo-part="item-label"]');
    expect(checkbox.hasAttribute("disabled")).toBe(true);
    expect(inheritedDisabledCheckbox.hasAttribute("disabled")).toBe(true);
    expect(checkbox.classList.contains("opacity-50")).toBe(false);
    expect(label?.classList.contains("opacity-50")).toBe(true);
    expect(label?.classList.contains("flex-row-reverse")).toBe(true);
    expect(screen.getByText("A channel is required")).toBeTruthy();
    expect(screen.getByText("Select at least one channel")).toBeTruthy();
  });
});
