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

const items = [{ label: "Apple" }, { label: "Banana" }];

function TriggerCombobox({ ref }: { ref?: { current: HTMLElement | null } }) {
  return (
    <Combobox aria-label="Fruit" items={items}>
      <Combobox.TriggerValue ref={ref} placeholder="Choose a fruit" />
      <Combobox.Content>
        <Combobox.Input aria-label="Search fruit" />
        <Combobox.List items={items}>
          {(item: { label: string }) => (
            <Combobox.Item value={item}>{item.label}</Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

describe("Combobox.TriggerValue", () => {
  it("is tab reachable and preserves its consumer ref", () => {
    const ref = { current: null as HTMLElement | null };
    render(() => <TriggerCombobox ref={ref} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("tabindex")).not.toBe("-1");
    expect(ref.current).toBe(trigger);
  });

  for (const key of ["ArrowDown", "Enter"]) {
    it(`opens with ${key}, focuses the popup input, and restores trigger focus on Escape`, async () => {
      render(() => <TriggerCombobox />);
      const trigger = screen.getByRole("combobox");
      trigger.focus();

      fireEvent.keyDown(trigger, { key });
      fireEvent.keyUp(trigger, { key });

      const input = await screen.findByLabelText("Search fruit");
      await waitFor(() => expect(document.activeElement).toBe(input));

      fireEvent.keyDown(input, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByLabelText("Search fruit")).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });
    });
  }

  it("restores trigger focus when the popup is dismissed", async () => {
    render(() => <TriggerCombobox />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await screen.findByLabelText("Search fruit");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Search fruit")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
