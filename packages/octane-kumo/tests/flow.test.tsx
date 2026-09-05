/** @jsxImportSource octane */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { useState } from "octane";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Flow } from "../src/components/flow";
import { createRoundedPath } from "../src/components/flow/connectors";
import {
  computeDiagramRect,
  computeEdges,
  computePositions,
  type FlowState,
} from "../src/components/flow/flow-layout";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Flow geometry", () => {
  const state: FlowState = {
    nodes: {
      start: { width: 40, height: 20 },
      a: { width: 30, height: 20 },
      b: { width: 60, height: 30 },
      end: { width: 40, height: 20 },
    },
    tree: {
      kind: "list",
      children: [
        { kind: "node", id: "start" },
        {
          kind: "parallel",
          children: [
            { kind: "node", id: "a" },
            { kind: "node", id: "b" },
          ],
        },
        { kind: "node", id: "end" },
      ],
    },
    align: "center",
    orientation: "horizontal",
  };

  it("retains nested branch edges and measured layout", () => {
    expect(computeEdges(state)).toEqual([
      ["start", "a"],
      ["start", "b"],
      ["a", "end"],
      ["b", "end"],
    ]);
    const positions = computePositions(state);
    expect(positions).toEqual({
      start: { x: 0, y: 23 },
      a: { x: 104, y: 0 },
      b: { x: 104, y: 36 },
      end: { x: 228, y: 23 },
    });
    expect(computeDiagramRect(positions, state)).toEqual({
      width: 268,
      height: 66,
    });
  });

  it("serializes portable rounded SVG commands", () => {
    expect(
      createRoundedPath(
        { x1: 0, y1: 17, x2: 56, y2: 71 },
        { orientation: "horizontal", single: false },
      ),
    ).toBe("M 0 17 L 32 17 L 32 63 Q 32 71 40 71 L 48 71");
  });
});

describe("Flow DOM", () => {
  it("bounds wheel and pointer panning without intercepting node interaction", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === "flow-contents"
          ? new DOMRect(0, 0, 500, 400)
          : new DOMRect(0, 0, 200, 200);
      },
    );
    const overflow = vi.fn();
    render(() => (
      <Flow padding={{ x: 10, y: 10 }} onOverflowChange={overflow}>
        <Flow.Node id="start" render={<button />}>
          Start
        </Flow.Node>
      </Flow>
    ));
    const content = screen.getByTestId("flow-contents");
    const canvas = content.parentElement!;
    await waitFor(() =>
      expect(overflow).toHaveBeenCalledWith({ x: true, y: true }),
    );
    fireEvent.wheel(canvas, { deltaX: 10000, deltaY: 10000 });
    expect(content.style.transform).toBe("translate(-320px, -220px)");
    fireEvent.wheel(canvas, { deltaX: -10000, deltaY: -10000 });
    expect(content.style.transform).toBe("translate(0px, 0px)");
    fireEvent.pointerDown(screen.getByRole("button"), {
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 50, clientY: 50 });
    expect(content.style.transform).toBe("translate(0px, 0px)");
    fireEvent.pointerDown(canvas, {
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 50, clientY: 60 });
    expect(content.style.transform).toBe("translate(-50px, -40px)");
    expect(canvas.style.cursor).toBe("grabbing");
    fireEvent.pointerCancel(canvas, { pointerId: 1 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 0, clientY: 0 });
    expect(content.style.transform).toBe("translate(-50px, -40px)");
    expect(canvas.style.cursor).toBe("grab");
  });

  it("updates nested branch alignment, ordering, and connectors when nodes change", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return new DOMRect(0, 0, this.dataset.nodeId === "wide" ? 100 : 40, 20);
      },
    );
    function Example() {
      const [end, setEnd] = useState(false);
      const [reverse, setReverse] = useState(false);
      const [extra, setExtra] = useState(false);
      return (
        <>
          <button onClick={() => setEnd(!end)}>Align</button>
          <button onClick={() => setReverse(!reverse)}>Reverse</button>
          <button onClick={() => setExtra(!extra)}>Extra</button>
          <Flow canvas={false}>
            <Flow.Node id="start">Start</Flow.Node>
            <Flow.Parallel align={end ? "end" : undefined}>
              {(reverse ? ["narrow", "wide"] : ["wide", "narrow"]).map((id) => (
                <Flow.Node key={id} id={id}>
                  {id}
                </Flow.Node>
              ))}
            </Flow.Parallel>
            {extra && <Flow.Node id="extra">Extra node</Flow.Node>}
            <Flow.Node id="end">End</Flow.Node>
          </Flow>
        </>
      );
    }
    render(Example);
    await waitFor(() =>
      expect(screen.getByTestId("narrow").style.left).toBe("104px"),
    );
    expect(
      screen.getByTestId("narrow").parentElement?.getAttribute("data-flow-id"),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Align"));
    await waitFor(() =>
      expect(screen.getByTestId("narrow").style.left).toBe("164px"),
    );
    fireEvent.click(screen.getByText("Reverse"));
    await waitFor(() =>
      expect(screen.getByTestId("narrow").dataset.nodeIndex).toBe("0"),
    );
    fireEvent.click(screen.getByText("Extra"));
    await waitFor(() => expect(screen.getByTestId("extra-end")).toBeTruthy());
    fireEvent.click(screen.getByText("Extra"));
    await waitFor(() => expect(screen.queryByTestId("extra-end")).toBeNull());
  });

  it("registers dynamic nested lists and preserves descriptor refs and handlers", async () => {
    let ref: HTMLElement | null = null;
    const click = vi.fn();
    render(() => (
      <Flow canvas={false}>
        <Flow.Node
          id="start"
          render={
            <button
              ref={(value) => {
                ref = value;
              }}
              onClick={click}
              data-testid="custom"
            />
          }
        >
          Start
        </Flow.Node>
        <Flow.Parallel>
          <Flow.List>
            <Flow.Node id="branch">Branch</Flow.Node>
          </Flow.List>
        </Flow.Parallel>
        <Flow.Node id="end" disabled>
          End
        </Flow.Node>
      </Flow>
    ));
    const custom = screen.getByTestId("custom");
    custom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(ref).toBe(custom);
    expect(click).toHaveBeenCalledOnce();
    expect(custom.getAttribute("data-node-id")).toBe("start");
    await waitFor(() => expect(screen.getByTestId("branch-end")).toBeTruthy());
  });

  it("uses anchor elements and rejects anchors outside nodes", () => {
    render(() => (
      <Flow>
        <Flow.Node id="anchored">
          <Flow.Anchor render={<span data-testid="anchor" />}>Port</Flow.Anchor>
        </Flow.Node>
      </Flow>
    ));
    expect(screen.getByTestId("anchor").textContent).toBe("Port");
    expect(() => render(() => <Flow.Anchor>bad</Flow.Anchor>)).toThrow(
      "Flow.Anchor must be used within Flow.Node",
    );
  });
});
