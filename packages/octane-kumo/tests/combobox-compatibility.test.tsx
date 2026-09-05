/** @jsxImportSource octane */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Combobox } from "../src/components/combobox/combobox";

afterEach(cleanup);

type Item = { id: string; label: string };
const items: Item[] = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
];

function Options() {
  return (
    <Combobox.Content>
      <Combobox.List items={items}>
        {(item: Item) => (
          <Combobox.Item value={item}>{item.label}</Combobox.Item>
        )}
      </Combobox.List>
    </Combobox.Content>
  );
}

describe("Combobox React compatibility", () => {
  it("owns an uncontrolled application value and returns the original object", async () => {
    const changes: (Item | null)[] = [];
    render(() => (
      <Combobox<Item>
        aria-label="Number"
        items={items}
        itemToStringLabel={(item) => item.label}
        itemToStringValue={(item) => item.id}
        onValueChange={(item) => changes.push(item)}
      >
        <Combobox.TriggerInput />
        <Options />
      </Combobox>
    ));

    fireEvent.click(screen.getByRole("button", { name: "Show options" }));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Two" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("option", { name: "Two" }));

    await waitFor(() => expect(changes).toEqual([items[1]]));
  });

  it("serializes application values rather than internal selection keys", () => {
    const retained = { id: "retained", label: "Retained outside collection" };
    const { container } = render(() => (
      <Combobox<Item>
        aria-label="Number"
        items={items}
        itemToStringValue={(item) => item.id}
        name="number"
        value={retained}
      >
        <Combobox.TriggerValue />
        <Options />
      </Combobox>
    ));

    const hidden = container.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    expect(hidden?.name).toBe("number");
    expect(hidden?.value).toBe("retained");
    expect(screen.getByRole("combobox").getAttribute("name")).toBeNull();
  });
});
