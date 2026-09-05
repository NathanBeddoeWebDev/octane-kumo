/** @jsxImportSource octane */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { fr } from "@octanejs/day-picker/locale";
import { DatePicker } from "../src/components/date-picker";
import { DatePickerFixture } from "./fixtures/date-pickers";

afterEach(cleanup);
const month = new Date(2024, 8, 1);
function day(container: HTMLElement, date: string) {
  const button = container.querySelector<HTMLButtonElement>(
    `[data-day="${date}"]:not([data-outside]) button`,
  );
  if (!button) throw new Error(`Missing day button: ${date}`);
  return button;
}

describe("DatePicker", () => {
  it("selects and clears a controlled single date with native callback events", () => {
    const { container } = render(DatePickerFixture);
    fireEvent.click(day(container, "2024-09-12"));
    expect(screen.getByTestId("date-selection").textContent).toBe("12");
    fireEvent.click(day(container, "2024-09-12"));
    expect(screen.getByTestId("date-selection").textContent).toBe("none");
    cleanup();
    const changed = vi.fn();
    const clicked = vi.fn();
    const view = render(DatePicker, {
      props: {
        mode: "single",
        defaultMonth: month,
        onChange: changed,
        onDayClick: clicked,
      },
    });
    fireEvent.click(day(view.container, "2024-09-12"));
    expect(changed.mock.calls[0][0]).toEqual(new Date(2024, 8, 12));
    expect(changed.mock.calls[0][3]).toBeInstanceOf(MouseEvent);
    expect(clicked.mock.calls[0][2]).toBeInstanceOf(MouseEvent);
    // Like the oracle, providing a selection callback opts into controlled state.
    expect(
      view.container.querySelector('[data-day="2024-09-12"][data-selected]'),
    ).toBeNull();
    cleanup();
    const uncontrolled = render(DatePicker, {
      props: { mode: "single", defaultMonth: month },
    });
    fireEvent.click(day(uncontrolled.container, "2024-09-12"));
    expect(
      uncontrolled.container.querySelector(
        '[data-day="2024-09-12"][data-selected]',
      ),
    ).toBeTruthy();
  });

  it("keeps required selections and enforces disabled days", () => {
    const changed = vi.fn();
    const { container } = render(DatePicker, {
      props: {
        mode: "single",
        required: true,
        selected: new Date(2024, 8, 10),
        defaultMonth: month,
        disabled: new Date(2024, 8, 20),
        onChange: changed,
      },
    });
    fireEvent.click(day(container, "2024-09-10"));
    expect(changed.mock.calls[0][0]).toEqual(new Date(2024, 8, 10));
    expect(day(container, "2024-09-20").disabled).toBe(true);
  });

  it("toggles multiple dates and resets at max, matching the oracle", () => {
    const { container } = render(DatePickerFixture, {
      props: { mode: "multiple" },
    });
    for (const date of ["12", "14"])
      fireEvent.click(day(container, `2024-09-${date}`));
    expect(screen.getByTestId("date-selection").textContent).toBe("10,12,14");
    fireEvent.click(day(container, "2024-09-10"));
    expect(screen.getByTestId("date-selection").textContent).toBe("12,14");
    fireEvent.click(day(container, "2024-09-10"));
    fireEvent.click(day(container, "2024-09-16"));
    expect(screen.getByTestId("date-selection").textContent).toBe("16");
  });

  it("selects a range and preserves caller class names and modifiers", () => {
    const { container } = render(DatePicker, {
      props: {
        mode: "range",
        defaultMonth: month,
        min: 2,
        className: "caller-root",
        classNames: { root: "custom-root" },
        modifiers: { booked: new Date(2024, 8, 12) },
        modifiersClassNames: { booked: "booked" },
      },
    });
    fireEvent.click(day(container, "2024-09-10"));
    fireEvent.click(day(container, "2024-09-14"));
    expect(day(container, "2024-09-10").parentElement?.className).toContain(
      "rdp-range_start",
    );
    expect(day(container, "2024-09-14").parentElement?.className).toContain(
      "rdp-range_end",
    );
    expect(container.firstElementChild?.className).toContain(
      "rdp-root rounded-xl bg-kumo-base select-none custom-root caller-root",
    );
    expect(day(container, "2024-09-12").parentElement?.className).toContain(
      "booked",
    );
    expect(day(container, "2024-09-12").parentElement?.className).toContain(
      "rdp-range_middle",
    );
  });

  it("maps legacy bounds and focus aliases, with modern props taking precedence", async () => {
    const { container } = render(DatePicker, {
      props: {
        mode: "single",
        defaultMonth: month,
        today: new Date(2024, 8, 10),
        initialFocus: true,
        fromMonth: month,
        toMonth: new Date(2024, 9, 1),
        animate: false,
      },
    });
    await waitFor(() =>
      expect(document.activeElement).toBe(day(container, "2024-09-10")),
    );
    expect(
      screen
        .getByRole("button", { name: /previous month/i })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByRole("grid", { name: "October 2024" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /next month/i })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    cleanup();
    render(DatePicker, {
      props: {
        mode: "single",
        defaultMonth: month,
        fromYear: 2024,
        toYear: 2024,
        startMonth: month,
        endMonth: month,
      },
    });
    expect(
      screen
        .getAllByRole("button", { name: /month/i })
        .every((button) => button.getAttribute("aria-disabled") === "true"),
    ).toBe(true);
  });

  it("supports localized dropdowns, hidden/outside days and custom Octane components", () => {
    const { container } = render(DatePicker, {
      props: {
        mode: "single",
        defaultMonth: month,
        locale: fr,
        captionLayout: "dropdown",
        showOutsideDays: false,
        hidden: new Date(2024, 8, 13),
        footer: <span>Choose a date</span>,
        components: {
          Chevron: ({ orientation }) => (
            <span data-testid="chevron">{orientation}</span>
          ),
        },
      },
    });
    expect(screen.getByRole("grid", { name: "septembre 2024" })).toBeTruthy();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getAllByTestId("chevron").length).toBeGreaterThan(0);
    expect(screen.getByText("Choose a date")).toBeTruthy();
    expect(
      container.querySelector('[data-day="2024-09-13"] button'),
    ).toBeNull();
    expect(container.querySelector("[data-outside] button")).toBeNull();
  });
});
