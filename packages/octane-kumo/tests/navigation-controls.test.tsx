/** @jsxImportSource octane */
import { Gear, List } from "@octanejs/phosphor-icons";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { InputGroup } from "../src/components/input-group/input-group";
import { MenuBar } from "../src/components/menubar/menubar";
import { Tabs } from "../src/components/tabs/tabs";
import { Toolbar } from "../src/components/toolbar/toolbar";

afterEach(cleanup);

describe("Tabs", () => {
  it("selects an uncontrolled tab and reports its string value", async () => {
    const values: string[] = [];
    render(Tabs, {
      props: {
        selectedValue: "overview",
        tabs: [
          { value: "overview", label: "Overview" },
          { value: "settings", label: "Settings" },
        ],
        onValueChange: (value: string) => values.push(value),
      },
    });

    const overview = screen.getByRole("tab", { name: "Overview" });
    const settings = screen.getByRole("tab", { name: "Settings" });
    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(settings.getAttribute("aria-selected")).toBe("false");

    await act(async () => {
      fireEvent.click(settings);
      await Promise.resolve();
    });

    expect(values).toEqual(["settings"]);
    expect(settings.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps controlled selection external and supports manual keyboard activation", async () => {
    const values: string[] = [];
    const { rerender } = render(Tabs, {
      props: {
        value: "overview",
        tabs: [
          { value: "overview", label: "Overview" },
          { value: "settings", label: "Settings" },
        ],
        onValueChange: (value: string) => values.push(value),
      },
    });

    const overview = screen.getByRole("tab", { name: "Overview" });
    const settings = screen.getByRole("tab", { name: "Settings" });
    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    await waitFor(() => expect(document.activeElement).toBe(settings));
    expect(overview.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(settings, { key: "Enter" });
    expect(values).toEqual(["settings"]);
    expect(overview.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(settings);
    expect(values).toEqual(["settings", "settings"]);
    expect(overview.getAttribute("aria-selected")).toBe("true");

    rerender({
      props: {
        value: "settings",
        tabs: [
          { value: "overview", label: "Overview" },
          { value: "settings", label: "Settings" },
        ],
      },
    });
    expect(settings.getAttribute("aria-selected")).toBe("true");
  });

  it("supports link-rendered tabs and Kumo styling hooks", () => {
    render(Tabs, {
      props: {
        size: "sm",
        variant: "underline",
        selectedValue: "details",
        tabs: [
          {
            value: "details",
            label: "Details",
            nativeButton: false,
            render: <a href="#details" />,
          },
        ],
      },
    });

    const tab = screen.getByRole("tab", { name: "Details" });
    expect(tab.tagName).toBe("A");
    expect(tab.getAttribute("href")).toBe("#details");
    expect(tab.classList.contains("text-xs")).toBe(true);
    expect(document.querySelector('[data-kumo-part="indicator"]')).toBeTruthy();
  });

  it("activates focused tabs when requested", async () => {
    const values: string[] = [];
    render(Tabs, {
      props: {
        activateOnFocus: true,
        onValueChange: (value: string) => values.push(value),
        selectedValue: "overview",
        tabs: [
          { value: "overview", label: "Overview" },
          { value: "settings", label: "Settings" },
        ],
      },
    });

    const overview = screen.getByRole("tab", { name: "Overview" });
    const settings = screen.getByRole("tab", { name: "Settings" });
    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    await waitFor(() => {
      expect(document.activeElement).toBe(settings);
      expect(settings.getAttribute("aria-selected")).toBe("true");
    });
    expect(values).toEqual(["settings"]);
  });

  it("hides overflow controls when removed tabs leave the list fitting", async () => {
    const manyTabs = [
      { value: "overview", label: "Overview" },
      { value: "metrics", label: "Metrics" },
      { value: "deployments", label: "Deployments" },
    ];
    const { container, rerender } = render(Tabs, {
      props: { selectedValue: "overview", tabs: manyTabs },
    });
    const list = screen.getByRole("tablist");
    Object.defineProperty(list, "clientWidth", {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(list, "scrollWidth", {
      configurable: true,
      value: 400,
    });
    fireEvent.scroll(list);
    const endControl = container.querySelector(
      '[data-kumo-part="overflow-control"][data-side="end"]',
    );

    await waitFor(() =>
      expect(endControl?.getAttribute("aria-hidden")).toBe("false"),
    );

    Object.defineProperty(list, "scrollWidth", {
      configurable: true,
      value: 200,
    });
    rerender({
      props: { selectedValue: "overview", tabs: manyTabs.slice(0, 2) },
    });

    await waitFor(() =>
      expect(endControl?.getAttribute("aria-hidden")).toBe("true"),
    );
  });

  it("renders nothing for an empty item list", () => {
    const { container } = render(Tabs, { props: { tabs: [] } });
    expect(container.textContent).toBe("");
  });
});

describe("Toolbar", () => {
  it("composes its root and supports vertical roving focus", async () => {
    function Fixture() {
      return (
        <Toolbar
          aria-label="Vertical controls"
          orientation="vertical"
          render={<section data-custom-root="" />}
        >
          <Toolbar.Button>First</Toolbar.Button>
          <Toolbar.Button>Second</Toolbar.Button>
        </Toolbar>
      );
    }

    render(Fixture);
    const toolbar = screen.getByRole("toolbar", { name: "Vertical controls" });
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    expect(toolbar.tagName).toBe("SECTION");
    expect(toolbar.getAttribute("data-custom-root")).toBe("");
    expect(first.getAttribute("data-orientation")).toBe("vertical");

    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    await waitFor(() => expect(document.activeElement).toBe(second));
  });

  it("groups controls at one size and moves roving focus", async () => {
    function Fixture() {
      return (
        <Toolbar aria-label="Editor controls" size="sm">
          <Toolbar.Button>Before</Toolbar.Button>
          <Toolbar.Input aria-label="Search" />
          <Toolbar.Link href="#docs">Documentation</Toolbar.Link>
          <Toolbar.Button>After</Toolbar.Button>
        </Toolbar>
      );
    }

    render(Fixture);
    const toolbar = screen.getByRole("toolbar", { name: "Editor controls" });
    const before = screen.getByRole("button", { name: "Before" });
    const input = screen.getByRole("textbox", {
      name: "Search",
    }) as HTMLInputElement;
    const link = screen.getByRole("link", { name: "Documentation" });

    expect(toolbar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(before.classList.contains("h-6.5")).toBe(true);
    expect(input.classList.contains("h-6.5")).toBe(true);

    before.focus();
    fireEvent.keyDown(before, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(input));

    input.setSelectionRange(0, 0);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(document.activeElement).toBe(input);

    input.setSelectionRange(input.value.length, input.value.length);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(link));
  });

  it("honors disabled focusability and prevents activation", async () => {
    const calls: string[] = [];
    function Fixture() {
      return (
        <Toolbar>
          <Toolbar.Button>Before</Toolbar.Button>
          <Toolbar.Button
            disabled
            onClick={() => calls.push("focusable-disabled")}
          >
            Focusable disabled
          </Toolbar.Button>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            Skipped disabled
          </Toolbar.Button>
          <Toolbar.Button onClick={() => calls.push("after")}>
            After
          </Toolbar.Button>
        </Toolbar>
      );
    }

    render(Fixture);
    const before = screen.getByRole("button", { name: "Before" });
    const focusableDisabled = screen.getByRole("button", {
      name: "Focusable disabled",
    });
    const after = screen.getByRole("button", { name: "After" });

    expect(focusableDisabled.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(focusableDisabled);
    expect(calls).toEqual([]);

    before.focus();
    fireEvent.keyDown(before, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(focusableDisabled));
    fireEvent.keyDown(focusableDisabled, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(after));
  });

  it("integrates InputGroup inputs into the toolbar focus order", async () => {
    function Fixture() {
      return (
        <Toolbar>
          <Toolbar.Button>Before</Toolbar.Button>
          <Toolbar.InputGroup aria-label="Worker subdomain">
            <InputGroup.Input placeholder="my-worker" />
            <InputGroup.Suffix>.workers.dev</InputGroup.Suffix>
          </Toolbar.InputGroup>
          <Toolbar.Button>After</Toolbar.Button>
        </Toolbar>
      );
    }

    render(Fixture);
    const before = screen.getByRole("button", { name: "Before" });
    const input = screen.getByRole("textbox", { name: "Worker subdomain" });
    before.focus();
    fireEvent.keyDown(before, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it("prevents interaction with InputGroup inputs in a disabled toolbar", () => {
    const calls: string[] = [];

    function Fixture() {
      return (
        <Toolbar disabled>
          <Toolbar.InputGroup aria-label="Disabled search">
            <InputGroup.Input
              onClick={() => calls.push("click")}
              onKeyDown={() => calls.push("keydown")}
            />
          </Toolbar.InputGroup>
        </Toolbar>
      );
    }

    render(Fixture);
    const input = screen.getByRole("textbox", { name: "Disabled search" });
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    const keyEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "a",
    });

    expect(input.dispatchEvent(clickEvent)).toBe(false);
    expect(input.dispatchEvent(keyEvent)).toBe(false);
    expect(calls).toEqual(["keydown"]);
  });
});

describe("MenuBar", () => {
  it("matches active options by id and invokes selections", () => {
    const calls: string[] = [];
    render(MenuBar, {
      props: {
        isActive: "grid",
        optionIds: true,
        options: [
          {
            id: "list",
            icon: <List />,
            tooltip: "List view",
            onClick: () => calls.push("list"),
          },
          {
            id: "grid",
            icon: <Gear />,
            tooltip: "Grid view",
            onClick: () => calls.push("grid"),
          },
        ],
      },
    });

    const active = screen.getByRole("button", { name: "Grid view" });
    expect(active.classList.contains("bg-kumo-base")).toBe(true);
    fireEvent.click(active);
    expect(calls).toEqual(["grid"]);
  });

  it("wraps focus with horizontal arrow keys", async () => {
    render(MenuBar, {
      props: {
        isActive: 0,
        options: [
          {
            icon: <List />,
            tooltip: "List view",
            onClick: () => undefined,
          },
          {
            icon: <Gear />,
            tooltip: "Grid view",
            onClick: () => undefined,
          },
        ],
      },
    });

    const list = screen.getByRole("button", { name: "List view" });
    const grid = screen.getByRole("button", { name: "Grid view" });
    list.focus();
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    await waitFor(() => expect(document.activeElement).toBe(grid));
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    await waitFor(() => expect(document.activeElement).toBe(list));
  });
});
