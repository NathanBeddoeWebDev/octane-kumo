/** @jsxImportSource octane */
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import DateRangePicker, {
  dateRangePickerVariants,
} from "../src/components/date-range-picker";

const noop = () => {};

beforeEach(() => vi.useFakeTimers().setSystemTime(new Date(2024, 0, 31, 15)));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DateRangePicker", () => {
  it("renders two 42-day calendars without IDs and preserves variants and timezone", () => {
    const { container } = render(DateRangePicker, {
      props: {
        onStartDateChange: noop,
        onEndDateChange: noop,
        size: "sm",
        variant: "subtle",
      },
    });
    expect(screen.getAllByRole("button")).toHaveLength(87);
    expect(container.querySelector("[id]")).toBeNull();
    expect(container.firstElementChild?.className).toContain("p-3");
    expect(container.firstElementChild?.className).toContain("bg-kumo-base");
    expect(
      screen.getByText("Timezone: New York, NY, USA (GMT-4)"),
    ).toBeTruthy();
    expect(dateRangePickerVariants({ size: "lg" })).toContain("p-5");
  });

  it("selects start, same/later end, and changes end after completion", () => {
    const starts = vi.fn();
    const ends = vi.fn();
    render(DateRangePicker, {
      props: { onStartDateChange: starts, onEndDateChange: ends },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Monday, January 15, 2024" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Monday, January 15, 2024, selected as start date",
      }),
    );
    expect(ends.mock.calls[0][0]).toEqual(new Date(2024, 0, 15));
    fireEvent.click(
      screen.getByRole("button", { name: "Saturday, January 20, 2024" }),
    );
    expect(ends.mock.calls[1][0]).toEqual(new Date(2024, 0, 20));
    fireEvent.click(
      screen.getByRole("button", { name: "Wednesday, January 10, 2024" }),
    );
    expect(starts.mock.calls[1][0]).toEqual(new Date(2024, 0, 10));
  });

  it("previews unfinished ranges from hover and focus", () => {
    render(DateRangePicker, {
      props: { onStartDateChange: noop, onEndDateChange: noop },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Monday, January 15, 2024" }),
    );
    fireEvent.mouseOver(
      screen.getByRole("button", { name: "Saturday, January 20, 2024" }),
    );
    expect(
      screen.getByRole("button", {
        name: "Thursday, January 18, 2024, within selected range",
      }),
    ).toBeTruthy();
    fireEvent.focus(
      screen.getByRole("button", { name: "Thursday, January 25, 2024" }),
    );
    expect(
      screen.getByRole("button", {
        name: "Tuesday, January 23, 2024, within selected range",
      }),
    ).toBeTruthy();
  });

  it("resets both callbacks and displays a custom timezone", () => {
    const starts = vi.fn();
    const ends = vi.fn();
    render(DateRangePicker, {
      props: {
        onStartDateChange: starts,
        onEndDateChange: ends,
        timezone: "UTC",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset Dates" }));
    expect(starts).toHaveBeenLastCalledWith(null);
    expect(ends).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("Timezone: UTC")).toBeTruthy();
  });

  it("normalizes month navigation across January, leap February, and years", () => {
    render(DateRangePicker, {
      props: { onStartDateChange: noop, onEndDateChange: noop },
    });
    const inputs = () => screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs().map((input) => input.value)).toEqual([
      "January 2024",
      "February 2024",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(inputs().map((input) => input.value)).toEqual([
      "February 2024",
      "March 2024",
    ]);
    expect(
      screen.getAllByRole("button", { name: "Thursday, February 29, 2024" })
        .length,
    ).toBeGreaterThan(0);
    fireEvent.input(inputs()[0], { target: { value: "December 2024" } });
    fireEvent.blur(inputs()[0]);
    expect(inputs().map((input) => input.value)).toEqual([
      "December 2024",
      "January 2025",
    ]);
  });

  it("accepts valid month edits and ignores invalid ones", () => {
    render(DateRangePicker, {
      props: { onStartDateChange: noop, onEndDateChange: noop },
    });
    let input = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    fireEvent.input(input, { target: { value: "April 2025" } });
    fireEvent.blur(input);
    expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe(
      "March 2025",
    );
    input = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    fireEvent.input(input, { target: { value: "not a month" } });
    fireEvent.blur(input);
    expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe(
      "not a month",
    );
    expect((screen.getAllByRole("textbox")[1] as HTMLInputElement).value).toBe(
      "April 2025",
    );
  });

  it("does not duplicate IDs across multiple instances", () => {
    const { container } = render(() => (
      <>
        <DateRangePicker onStartDateChange={noop} onEndDateChange={noop} />
        <DateRangePicker onStartDateChange={noop} onEndDateChange={noop} />
      </>
    ));
    const ids = Array.from(
      container.querySelectorAll("[id]"),
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
