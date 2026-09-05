/** @jsxImportSource octane */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { useState } from "octane";
import { afterEach, expect, it } from "vite-plus/test";
import { Select } from "../src/components/select/select";
import { Combobox } from "../src/components/combobox/combobox";
import { Autocomplete } from "../src/components/autocomplete/autocomplete";
import { Toolbar } from "../src/components/toolbar/toolbar";

afterEach(cleanup);

it("retains Select application identity across reordered colliding keys and serializes objects", async () => {
  const a = { id: "same", label: "A" };
  const b = { id: "same", label: "B" };
  function Fixture() {
    const [items, setItems] = useState([a, b]);
    return (
      <form>
        <button type="button" onClick={() => setItems([b, a])}>
          Reorder
        </button>
        <Select
          name="choice"
          label="Choice"
          defaultValue={b}
          items={items.map((value) => ({ value, label: value.label }))}
          renderValue={(value) => value.label}
        />
      </form>
    );
  }
  const { container } = render(Fixture);
  fireEvent.click(screen.getByText("Reorder"));
  await waitFor(() =>
    expect(screen.getByRole("combobox").textContent).toContain("B"),
  );
  expect(new FormData(container.querySelector("form")!).get("choice")).toBe(
    JSON.stringify(b),
  );
});

it("renders the controlled Select object even outside the collection", () => {
  const selected = { id: "x", label: "Original" };
  render(() => (
    <Select
      label="Choice"
      value={selected}
      items={[]}
      renderValue={(item) => item.label}
    />
  ));
  expect(screen.getByRole("combobox").textContent).toContain("Original");
});

it("associates visible autocomplete labels and descriptions", () => {
  render(() => (
    <Autocomplete
      label="Country"
      description="Choose your country"
      items={["Brazil"]}
    >
      <Autocomplete.InputGroup />
    </Autocomplete>
  ));
  const input = screen.getByRole("combobox");
  const label = screen.getByText("Country").closest("label")!;
  expect(label.htmlFor).toBe(input.id);
  expect(
    input
      .getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent),
  ).toContain("Choose your country");
});

it("composes Toolbar.Input and keeps its ref", () => {
  const ref = { current: null as HTMLInputElement | null };
  render(() => (
    <Toolbar>
      <Combobox label="Language" items={["English"]}>
        <Combobox.TriggerInput render={<Toolbar.Input />} ref={ref} />
      </Combobox>
    </Toolbar>
  ));
  expect(ref.current).toBe(screen.getByRole("combobox"));
});

it("passes application values to Value and removes chips from the keyboard", async () => {
  render(() => (
    <Combobox
      multiple
      label="Languages"
      items={["English", "French"]}
      defaultValue={["English", "French"]}
    >
      <Combobox.TriggerMultipleWithInput
        renderItem={(item: string) => <Combobox.Chip>{item}</Combobox.Chip>}
      />
      <Combobox.Value>
        {(values: string[]) => <output>{values.join("/")}</output>}
      </Combobox.Value>
    </Combobox>
  ));
  const input = screen.getByRole("combobox");
  fireEvent.keyDown(input, { key: "Backspace" });
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("English"),
  );
  fireEvent.keyDown(input, { key: "ArrowLeft" });
  expect(document.activeElement?.getAttribute("data-kumo-combobox-chip")).toBe(
    "",
  );
  fireEvent.keyDown(document.activeElement!, { key: "Delete" });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull(),
  );
});

it("restores uncontrolled form selections on reset", async () => {
  const { container } = render(() => (
    <form>
      <Select
        label="Choice"
        name="choice"
        defaultValue="a"
        items={{ a: "A", b: "B" }}
      />
    </form>
  ));
  fireEvent.click(screen.getByRole("combobox"));
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "B" })).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("option", { name: "B" }));
  await waitFor(() =>
    expect(new FormData(container.querySelector("form")!).get("choice")).toBe(
      "b",
    ),
  );
  container.querySelector("form")!.reset();
  await waitFor(() =>
    expect(new FormData(container.querySelector("form")!).get("choice")).toBe(
      "a",
    ),
  );
});
