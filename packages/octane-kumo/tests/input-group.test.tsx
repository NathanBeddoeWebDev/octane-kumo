/** @jsxImportSource octane */
import type { IconProps } from "@octanejs/phosphor-icons";
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { InputGroup } from "octane-kumo";

afterEach(cleanup);

function TestIcon(props: IconProps) {
  return <svg data-testid="test-icon" data-size={props.size} />;
}

describe("InputGroup", () => {
  it("composes its input, addon, suffix, and deprecated aliases", () => {
    const ref: { current: HTMLElement | null } = { current: null };
    render(() => (
      <InputGroup ref={ref}>
        <InputGroup.Label>@</InputGroup.Label>
        <InputGroup.Input aria-label="Username" />
        <InputGroup.Description>.example.com</InputGroup.Description>
        <InputGroup.Addon align="end">USD</InputGroup.Addon>
      </InputGroup>
    ));

    const group = screen
      .getByRole("textbox", { name: "Username" })
      .closest('[data-slot="input-group"]');
    expect(group?.tagName).toBe("LABEL");
    expect(ref.current).toBe(group);
    expect(group?.getAttribute("data-focus-mode")).toBe("container");
    expect(
      group?.querySelector('[data-slot="input-group-addon-start"]'),
    ).toBeTruthy();
    expect(
      group?.querySelector('[data-slot="input-group-addon-end"]'),
    ).toBeTruthy();
    expect(
      group?.querySelector('[data-slot="input-group-suffix"]')?.textContent,
    ).toBe(".example.com");
  });

  it("forwards input refs and native events while inheriting group state", () => {
    const ref: { current: HTMLInputElement | null } = { current: null };
    let event: InputEvent | undefined;

    render(() => (
      <InputGroup
        disabled
        error={{ match: true, message: "Invalid account" }}
        label="Account"
      >
        <InputGroup.Input
          name="account"
          onInput={(nextEvent: InputEvent) => {
            event = nextEvent;
          }}
          ref={ref}
        />
      </InputGroup>
    ));

    const input = screen.getByRole("textbox", { name: "Account" });
    expect(ref.current).toBe(input);
    expect(input.hasAttribute("disabled")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Invalid account").id,
    );
    fireEvent.input(input, { target: { value: "team" } });
    expect(event).toBeInstanceOf(InputEvent);
  });

  it("auto-detects individual mode for direct non-ghost buttons", () => {
    render(() => (
      <InputGroup>
        <InputGroup.Input aria-label="Page" />
        <InputGroup.Button variant="secondary">Next</InputGroup.Button>
      </InputGroup>
    ));

    const input = screen.getByRole("textbox", { name: "Page" });
    const group = input.closest('[data-slot="input-group"]');
    expect(group?.tagName).toBe("DIV");
    expect(group?.getAttribute("data-focus-mode")).toBe("individual");
    expect(input.classList.contains("border")).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Next" })
        .classList.contains("h-full!"),
    ).toBe(true);
  });

  it("partitions addons and inputs from direct buttons in hybrid mode", () => {
    render(() => (
      <InputGroup label="Search">
        <InputGroup.Addon>⌕</InputGroup.Addon>
        <InputGroup.Input />
        <InputGroup.Button variant="secondary">Go</InputGroup.Button>
      </InputGroup>
    ));

    const input = screen.getByRole("textbox", { name: "Search" });
    const group = input.closest('[data-slot="input-group"]');
    const zone = group?.querySelector(
      '[data-slot="input-group-container-zone"]',
    );
    const button = screen.getByRole("button", { name: "Go" });
    expect(group?.getAttribute("data-focus-mode")).toBe("hybrid");
    expect(zone?.contains(input)).toBe(true);
    expect(zone?.textContent).toContain("⌕");
    expect(zone?.contains(button)).toBe(false);
    expect(button.parentElement).toBe(group);
  });

  it("treats the deprecated Label alias as an addon in hybrid mode", () => {
    render(() => (
      <InputGroup>
        <InputGroup.Label>@</InputGroup.Label>
        <InputGroup.Input aria-label="Account" />
        <InputGroup.Button variant="secondary">Check</InputGroup.Button>
      </InputGroup>
    ));

    const input = screen.getByRole("textbox", { name: "Account" });
    const group = input.closest('[data-slot="input-group"]');
    expect(group?.getAttribute("data-focus-mode")).toBe("hybrid");
    expect(
      group
        ?.querySelector('[data-slot="input-group-container-zone"]')
        ?.contains(input),
    ).toBe(true);
  });

  it("inherits button state, sizes icons, and derives a name from tooltip text", () => {
    render(() => (
      <InputGroup disabled size="lg">
        <InputGroup.Addon>
          <TestIcon />
        </InputGroup.Addon>
        <InputGroup.Input aria-label="Token" />
        <InputGroup.Addon align="end">
          <InputGroup.Button
            icon={TestIcon}
            shape="square"
            tooltip="Copy token"
          />
        </InputGroup.Addon>
      </InputGroup>
    ));

    const icons = screen.getAllByTestId("test-icon");
    expect(icons).toHaveLength(2);
    expect(icons[0]?.getAttribute("data-size")).toBe("20");
    expect(icons[1]?.getAttribute("data-size")).toBe("20");
    expect(
      screen
        .getByRole("button", { name: "Copy token" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
