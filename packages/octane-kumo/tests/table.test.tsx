/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import type { CheckboxChangeEventDetails } from "../src/components/checkbox";
import { Table } from "../src/components/table";

afterEach(cleanup);

describe("Table", () => {
  it("renders every compound with semantic elements, native props, handlers, and refs", () => {
    const tableRef: { current: HTMLTableElement | null } = { current: null };
    const cellRef: { current: HTMLTableCellElement | null } = { current: null };
    const handleRef: { current: HTMLButtonElement | null } = { current: null };
    let clicks = 0;

    function Fixture() {
      return (
        <Table ref={tableRef} data-testid="table" aria-label="Workers">
          <Table.Header data-testid="header">
            <Table.Row>
              <Table.Head scope="col">
                Name
                <Table.ResizeHandle ref={handleRef} onClick={() => clicks++} />
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="body">
            <Table.Row>
              <Table.Cell ref={cellRef} data-row="one">
                Worker
              </Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer data-testid="footer">
            <Table.Row>
              <Table.Cell>Total</Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>
      );
    }
    render(Fixture);

    expect(tableRef.current?.tagName).toBe("TABLE");
    expect(cellRef.current?.tagName).toBe("TD");
    expect(cellRef.current?.getAttribute("data-row")).toBe("one");
    expect(screen.getByTestId("header").tagName).toBe("THEAD");
    expect(screen.getByTestId("body").tagName).toBe("TBODY");
    expect(screen.getByTestId("footer").tagName).toBe("TFOOT");
    expect(screen.getByRole("columnheader").getAttribute("scope")).toBe("col");
    expect(handleRef.current?.type).toBe("button");
    fireEvent.click(screen.getByRole("button", { name: "Resize column" }));
    expect(clicks).toBe(1);
  });

  it("preserves layout, compact, sticky, selected, and resize styling", () => {
    function Fixture() {
      return (
        <Table layout="fixed" className="custom-table" data-testid="table">
          <Table.Header variant="compact" sticky data-testid="header">
            <Table.Row variant="selected" data-testid="row">
              <Table.Head sticky="left" data-testid="head">
                Name
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell sticky="right" data-testid="cell">
                Worker
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      );
    }
    render(Fixture);

    expect(screen.getByTestId("table").className).toContain("table-fixed");
    expect(screen.getByTestId("table").className).toContain("text-base");
    expect(screen.getByTestId("header").hasAttribute("data-compact")).toBe(
      true,
    );
    expect(screen.getByTestId("header").className).toContain(
      "sticky top-0 z-2",
    );
    expect(screen.getByTestId("row").className).toContain("bg-kumo-tint");
    expect(screen.getByTestId("head").className).toContain("sticky left-0");
    expect(screen.getByTestId("head").className).toContain("z-2");
    expect(screen.getByTestId("cell").className).toContain("sticky right-0");
    expect(screen.getByTestId("cell").className).toContain("z-1");
  });

  it("supports uncontrolled and controlled selection, details, aliases, indeterminate, and disabled states", async () => {
    const changes: boolean[] = [];
    const aliases: boolean[] = [];
    let details: CheckboxChangeEventDetails | undefined;
    const cellRef: { current: HTMLTableCellElement | null } = { current: null };
    function Fixture() {
      return (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.CheckHead label="All" indeterminate />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.CheckCell
                ref={cellRef}
                label="Uncontrolled"
                onCheckedChange={(value, eventDetails) => {
                  changes.push(value);
                  details = eventDetails;
                }}
                onValueChange={(value) => aliases.push(value)}
              />
              <Table.CheckCell
                label="Controlled"
                checked={false}
                onCheckedChange={(value) => changes.push(value)}
              />
              <Table.CheckCell
                label="Disabled"
                disabled
                onCheckedChange={(value) => changes.push(value)}
              />
            </Table.Row>
          </Table.Body>
        </Table>
      );
    }
    render(Fixture);

    const all = screen.getByRole("checkbox", { name: "All" });
    expect(all.getAttribute("aria-checked")).toBe("mixed");
    expect(cellRef.current?.className).toContain("w-10 leading-none");
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "Uncontrolled" }));
      await Promise.resolve();
    });
    expect(changes).toEqual([true]);
    expect(aliases).toEqual([true]);
    expect(details?.event).toBeInstanceOf(Event);
    expect(details?.reason).toBe("none");
    expect(
      screen
        .getByRole("checkbox", { name: "Uncontrolled" })
        .getAttribute("aria-checked"),
    ).toBe("true");

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "Controlled" }));
      await Promise.resolve();
    });
    expect(changes).toEqual([true, true]);
    expect(
      screen
        .getByRole("checkbox", { name: "Controlled" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen
        .getByRole("checkbox", { name: "Disabled" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));
      await Promise.resolve();
    });
    expect(changes).toEqual([true, true]);
  });
});
