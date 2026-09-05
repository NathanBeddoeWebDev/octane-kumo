/** @jsxImportSource octane */
import { act, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { FlowFixture } from "./fixtures/flow";
import { renderHydrationFixture } from "./hydration-ssr";

describe("Flow SSR and hydration", () => {
  it("adopts the server-rendered node DOM", async () => {
    const result = await renderHydrationFixture(
      "tests/fixtures/flow.tsx",
      "FlowFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = result.html;
    document.body.appendChild(container);
    const start = within(container).getByText("Start");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(FlowFixture, {}));
      });
      expect(within(container).getByText("Start")).toBe(start);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});
