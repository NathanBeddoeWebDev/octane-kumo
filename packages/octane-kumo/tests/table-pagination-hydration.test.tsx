/** @jsxImportSource octane */
import { act, fireEvent, waitFor, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { TablePaginationFixture } from "./fixtures/table-pagination";
import { renderHydrationFixture } from "./hydration-ssr";

describe("selectable paginated table SSR and hydration", () => {
  it.each([false, true])(
    "adopts rows and controls, then selects, pages, and changes page size (dropdown: %s)",
    async (dropdown) => {
      const props = { compact: true, dropdown, initialPage: 2 };
      const result = await renderHydrationFixture(
        "tests/fixtures/table-pagination.tsx",
        "TablePaginationFixture",
        props,
      );
      const container = document.createElement("div");
      container.innerHTML = result.html;
      document.body.appendChild(container);
      const view = within(container);
      const table = view.getByRole("table");
      const worker = view.getByText("Worker 4");
      const next = view.getByRole("button", { name: "Next page" });
      const pageSize = view.getByRole("combobox", { name: "Page size" });
      const pageNumber = view.getByRole(dropdown ? "combobox" : "textbox", {
        name: "Page number",
      });
      expect(
        dropdown
          ? pageNumber.textContent
          : (pageNumber as HTMLInputElement).value,
      ).toBe("2");
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(
            container,
            createElement(TablePaginationFixture, props),
          );
        });
        expect(view.getByRole("table")).toBe(table);
        expect(view.getByText("Worker 4")).toBe(worker);
        expect(view.getByRole("button", { name: "Next page" })).toBe(next);
        expect(view.getByRole("combobox", { name: "Page size" })).toBe(
          pageSize,
        );
        expect(
          view.getByRole(dropdown ? "combobox" : "textbox", {
            name: "Page number",
          }),
        ).toBe(pageNumber);
        fireEvent.click(
          view.getByRole("checkbox", { name: "Select all rows" }),
        );
        await waitFor(() =>
          expect(view.getByTestId("selected-count").textContent?.trim()).toBe(
            "4 selected",
          ),
        );
        fireEvent.click(next);
        expect(view.getByText("Worker 7")).toBeTruthy();
        expect(next.hasAttribute("disabled")).toBe(true);
        fireEvent.click(view.getByRole("button", { name: "First page" }));
        expect(
          view
            .getByRole("checkbox", { name: "Select all rows" })
            .getAttribute("aria-checked"),
        ).toBe("mixed");
        expect(
          view
            .getByRole("checkbox", { name: "Select Worker 3" })
            .hasAttribute("disabled"),
        ).toBe(true);
        fireEvent.click(
          view.getByRole("checkbox", { name: "Select all rows" }),
        );
        await waitFor(() =>
          expect(view.getByTestId("selected-count").textContent?.trim()).toBe(
            "5 selected",
          ),
        );
        fireEvent.click(pageSize);
        fireEvent.click(await view.findByRole("option", { name: "6" }));
        await waitFor(() => expect(view.getAllByRole("row")).toHaveLength(7));
        expect(view.getByText("1-6")).toBeTruthy();
        if (dropdown) {
          fireEvent.click(pageNumber);
          fireEvent.click(await view.findByRole("option", { name: "2" }));
        } else {
          fireEvent.input(pageNumber, { target: { value: "2" } });
          fireEvent.keyDown(pageNumber, { key: "Enter" });
        }
        await waitFor(() => expect(view.getByText("7-9")).toBeTruthy());
        expect(errors).not.toHaveBeenCalled();
      } finally {
        root?.unmount();
        errors.mockRestore();
        container.remove();
      }
    },
    // Includes a fresh server compilation alongside the full suite's builds.
    15000,
  );
});
