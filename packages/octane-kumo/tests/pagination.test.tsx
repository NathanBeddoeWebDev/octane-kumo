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
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Pagination } from "../src/components/pagination";

afterEach(cleanup);

describe("Pagination", () => {
  it("keeps the page caller-controlled, defaults to one, and synchronizes the draft on updates", async () => {
    const setPage = vi.fn();
    const { rerender } = render(Pagination, {
      props: { setPage, perPage: 10, totalCount: 42 },
    });
    expect(
      screen
        .getByRole("button", { name: "First page" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(setPage).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("1-10")).toBeTruthy();
    rerender({ props: { page: 5, setPage, perPage: 10, totalCount: 42 } });
    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5"),
    );
    expect(screen.getByText("41-42")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Next page" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Last page" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(setPage).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole("button", { name: "First page" }));
    expect(setPage).toHaveBeenLastCalledWith(1);
  });

  it("commits bounded integer drafts on Enter and blur without submitting forms", async () => {
    const setPage = vi.fn();
    render(Pagination, {
      props: { page: 2, setPage, perPage: 10, totalCount: 42 },
    });
    const input = screen.getByRole("textbox", {
      name: "Page number",
    }) as HTMLInputElement;
    for (const [draft, expected] of [
      ["99", 5],
      ["-2", 1],
      ["", 1],
      ["nope", 2],
      ["Infinity", 2],
      ["3.8", 3],
    ] as const) {
      await act(async () => {
        fireEvent.input(input, { target: { value: draft } });
      });
      expect(fireEvent.keyDown(input, { key: "Enter", cancelable: true })).toBe(
        false,
      );
      expect(setPage).toHaveBeenLastCalledWith(expected);
      expect(input.value).toBe(String(expected));
    }
    fireEvent.input(input, { target: { value: "4" } });
    fireEvent.blur(input);
    expect(setPage).toHaveBeenLastCalledWith(4);
    expect(input.autocomplete).toBe("off");
    expect(input.getAttribute("data-lpignore")).toBe("true");
  });

  it("supports unknown totals, simple controls, and known-total precedence", () => {
    const setPage = vi.fn();
    const { rerender } = render(Pagination, {
      props: { page: 3, setPage, hasNextPage: true },
    });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Last page" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(setPage).toHaveBeenLastCalledWith(4);
    rerender({ props: { page: 3, setPage, hasNextPage: false } });
    expect(
      screen
        .getByRole("button", { name: "Next page" })
        .hasAttribute("disabled"),
    ).toBe(true);
    rerender({
      props: {
        page: 3,
        setPage,
        hasNextPage: false,
        totalCount: 100,
        perPage: 10,
      },
    });
    expect(screen.getByRole("textbox")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Last page" }));
    expect(setPage).toHaveBeenLastCalledWith(10);
    rerender({
      props: {
        page: 1,
        setPage,
        totalCount: 100,
        perPage: 10,
        controls: "simple",
      },
    });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("keeps empty totals on page one and preserves legacy custom live text", () => {
    const setPage = vi.fn();
    const { container } = render(Pagination, {
      props: {
        setPage,
        totalCount: 0,
        perPage: 10,
        text: ({ pageShowingRange }) => `Empty ${pageShowingRange}`,
      },
    });
    expect(screen.getByText("Empty 0-0")).toBeTruthy();
    expect(
      container
        .querySelector('[aria-live="polite"]')
        ?.getAttribute("aria-atomic"),
    ).toBe("true");
    for (const button of screen.getAllByRole("button"))
      expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.input(screen.getByRole("textbox"), { target: { value: "0" } });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(setPage).toHaveBeenLastCalledWith(1);
  });

  it("composes localized info, page-size and page dropdown selectors with numeric callbacks", async () => {
    function Fixture() {
      const [page, setPage] = useState(1);
      const [perPage, setPerPage] = useState(10);
      return (
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalCount={30}
          labels={{
            navigation: "Strony",
            pageNumber: "Strona",
            pageSize: "Rozmiar",
            nextPage: "Dalej",
          }}
        >
          <Pagination.Info>
            {({ pageShowingRange, totalCount }) =>
              `Zakres ${pageShowingRange} / ${totalCount}`
            }
          </Pagination.Info>
          <Pagination.Separator />
          <Pagination.PageSize
            value={perPage}
            onChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
            options={[10, 20]}
            label="Na stronę:"
          />
          <Pagination.Controls pageSelector="dropdown" />
        </Pagination>
      );
    }
    const { container } = render(Fixture);
    expect(screen.getByRole("navigation", { name: "Strony" })).toBeTruthy();
    expect(screen.getByText("Zakres 1-10 / 30")).toBeTruthy();
    expect(
      container.querySelector('[data-slot="pagination-separator"]'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: "Strona" }));
    fireEvent.click(await screen.findByRole("option", { name: "3" }));
    await waitFor(() =>
      expect(screen.getByText("Zakres 21-30 / 30")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Rozmiar" }));
    fireEvent.click(await screen.findByRole("option", { name: "20" }));
    await waitFor(() =>
      expect(screen.getByText("Zakres 1-20 / 30")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dalej" }));
    expect(screen.getByText("Zakres 21-30 / 30")).toBeTruthy();
  });
});
