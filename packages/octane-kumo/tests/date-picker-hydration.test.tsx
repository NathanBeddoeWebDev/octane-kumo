/** @jsxImportSource octane */
import { act, fireEvent, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  DatePickerFixture,
  LegacyDatePickerFixture,
} from "./fixtures/date-pickers";
import { renderHydrationFixture } from "./hydration-ssr";

describe("date picker SSR and hydration", () => {
  it.each(["single", "multiple", "range"] as const)(
    "adopts %s selection and navigates after hydration",
    async (mode) => {
      const result = await renderHydrationFixture(
        "tests/fixtures/date-pickers.tsx",
        "DatePickerFixture",
        { mode },
      );
      const container = document.createElement("div");
      container.innerHTML = result.html;
      document.body.appendChild(container);
      const view = within(container);
      const grid = view.getByRole("grid", { name: "September 2024" });
      const next = view.getByRole("button", { name: /next month/i });
      const date = container.querySelector<HTMLButtonElement>(
        '[data-day="2024-09-12"]:not([data-outside]) button',
      )!;
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(
            container,
            createElement(DatePickerFixture, { mode }),
          );
        });
        expect(view.getByRole("grid", { name: "September 2024" })).toBe(grid);
        expect(
          container.querySelector(
            '[data-day="2024-09-12"]:not([data-outside]) button',
          ),
        ).toBe(date);
        expect(view.getByRole("button", { name: /next month/i })).toBe(next);
        fireEvent.click(date);
        expect(view.getByTestId("date-selection").textContent?.trim()).toBe(
          mode === "single" ? "12" : mode === "multiple" ? "10,12" : "10–12",
        );
        fireEvent.click(next);
        expect(view.getByRole("grid", { name: "October 2024" })).toBeTruthy();
        expect(errors).not.toHaveBeenCalled();
      } finally {
        root?.unmount();
        errors.mockRestore();
        container.remove();
      }
    },
    15000,
  );

  it("adopts the legacy calendar and selects, resets and navigates", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }).setSystemTime(
      new Date(2024, 0, 31, 15),
    );
    const container = document.createElement("div");
    let root: Root | undefined;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await renderHydrationFixture(
        "tests/fixtures/date-pickers.tsx",
        "LegacyDatePickerFixture",
      );
      container.innerHTML = result.html;
      document.body.appendChild(container);
      const view = within(container);
      const start = view.getByRole("button", {
        name: "Monday, January 15, 2024",
      });
      const month = view.getAllByRole("textbox")[0];
      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(LegacyDatePickerFixture, {}),
        );
      });
      expect(
        view.getByRole("button", { name: "Monday, January 15, 2024" }),
      ).toBe(start);
      expect(view.getAllByRole("textbox")[0]).toBe(month);
      fireEvent.click(start);
      fireEvent.click(
        view.getByRole("button", { name: "Saturday, January 20, 2024" }),
      );
      expect(view.getByTestId("legacy-selection").textContent?.trim()).toBe(
        "15–20",
      );
      fireEvent.click(view.getByRole("button", { name: "Reset Dates" }));
      expect(view.getByTestId("legacy-selection").textContent?.trim()).toBe(
        "none–none",
      );
      fireEvent.click(view.getByRole("button", { name: "Next month" }));
      expect((view.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe(
        "February 2024",
      );
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
      vi.useRealTimers();
    }
  }, 15000);
});
