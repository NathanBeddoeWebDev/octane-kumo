/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { useState } from "octane";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { CommandPalette as C } from "../src/components/command-palette";
import { KumoPortalProvider } from "../src/utils/portal-provider";

afterEach(cleanup);
const commands = ["Create", "Disabled", "Deploy"];
it("navigates without committing search, skips disabled, and dispatches native clicks and modifier selection", async () => {
  const click = vi.fn();
  const select = vi.fn();
  const highlight = vi.fn();
  render(() => (
    <C.Panel
      items={commands}
      getSelectableItems={(items) => items}
      onSelect={select}
      onItemHighlighted={highlight}
    >
      <C.Input aria-label="Search" />
      <C.List>
        <C.Results<string>>
          {(item) => (
            <C.Item value={item} disabled={item === "Disabled"} onClick={click}>
              {item}
            </C.Item>
          )}
        </C.Results>
      </C.List>
    </C.Panel>
  ));
  const input = screen.getByRole("searchbox");
  await act(async () => input.focus());
  await waitFor(() =>
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Create" }).id,
    ),
  );
  fireEvent.keyDown(input, { key: "ArrowDown" });
  await waitFor(() =>
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Deploy" }).id,
    ),
  );
  fireEvent.keyDown(input, { key: "Enter" });
  expect(click).toHaveBeenCalledOnce();
  expect(click.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  expect((input as HTMLInputElement).value).toBe("");
  fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
  expect(select).toHaveBeenCalledWith("Deploy", { newTab: true });
  expect(click).toHaveBeenCalledOnce();
  expect(highlight.mock.calls.at(-1)?.[0]).toBe("Deploy");
});
it("filters object values and displays an empty state", async () => {
  const items = [
    { id: 1, label: "Same", visible: false },
    { id: 2, label: "Same", visible: true },
  ];
  render(() => (
    <C.Panel
      items={items}
      filter={(item, query) => !query || (item.visible && query === "yes")}
    >
      <C.Input aria-label="Filter" />
      <C.List>
        <C.Results<(typeof items)[number]>>
          {(item) => <C.Item value={item}>{item.label}</C.Item>}
        </C.Results>
        <C.Empty />
      </C.List>
    </C.Panel>
  ));
  expect(await screen.findAllByRole("option")).toHaveLength(2);
  fireEvent.input(screen.getByRole("searchbox"), { target: { value: "yes" } });
  await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
  fireEvent.input(screen.getByRole("searchbox"), {
    target: { value: "missing" },
  });
  expect(await screen.findByText("No results found")).toBeTruthy();
});
it("renders grouped iterators, rich highlights and noninteractive results", async () => {
  const groups = [
    {
      label: "Resources",
      items: [
        { id: "a", title: "Workers" },
        { id: "b", title: "Help" },
      ],
    },
  ];
  const click = vi.fn();
  render(() => (
    <C.Panel
      items={groups}
      getSelectableItems={(items) => items.flatMap((item) => item.items)}
    >
      <C.Input />
      <C.List>
        <C.Results<(typeof groups)[number]>>
          {(group) => (
            <C.Group items={group.items}>
              <C.GroupLabel>{group.label}</C.GroupLabel>
              <C.Items<(typeof group.items)[number]>>
                {(item) => (
                  <C.ResultItem
                    value={item}
                    title={item.title}
                    titleHighlights={[
                      [0, 1],
                      [1, 2],
                    ]}
                    breadcrumbs={["Compute"]}
                    onClick={click}
                    nonInteractive={item.id === "b"}
                  />
                )}
              </C.Items>
            </C.Group>
          )}
        </C.Results>
      </C.List>
    </C.Panel>
  ));
  expect(await screen.findByRole("group", { name: "Resources" })).toBeTruthy();
  expect(screen.getAllByRole("option")).toHaveLength(2);
  expect(screen.getAllByText("Wor")[0].tagName).toBe("MARK");
  fireEvent.click(screen.getByRole("option", { name: /Help/ }));
  expect(click).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("option", { name: /Workers/ }));
  expect(click).toHaveBeenCalledOnce();
});
it("routes modal portals, allows consumer Escape override, and restores trigger focus", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const onKeyDown = vi.fn((event: KeyboardEvent) => {
    if (event.key === "Escape") event.preventDefault();
  });
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <KumoPortalProvider container={container}>
        <button onClick={() => setOpen(true)}>Open palette</button>
        <C.Root open={open} onOpenChange={setOpen} items={commands}>
          <C.Input
            onKeyDown={onKeyDown}
            trailing={
              <button onClick={() => setOpen(false)}>Close palette</button>
            }
          />
          <C.List>
            <C.Results<string>>
              {(item) => <C.Item value={item}>{item}</C.Item>}
            </C.Results>
          </C.List>
        </C.Root>
      </KumoPortalProvider>
    );
  }
  try {
    render(Example);
    const trigger = screen.getByRole("button", { name: "Open palette" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(
      await screen.findByRole("dialog", { name: "Command palette" }),
    ).toBeTruthy();
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close palette" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  } finally {
    container.remove();
  }
});
