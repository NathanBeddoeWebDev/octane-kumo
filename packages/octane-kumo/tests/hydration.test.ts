/** @jsxImportSource octane */
import { act, fireEvent } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { ButtonHydrationFixture } from "./fixtures/button-hydration";
import { renderHydrationFixture } from "./hydration-ssr";

describe("Button SSR and hydration", () => {
  it("adopts server markup and remains interactive", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/button-hydration.tsx",
      "ButtonHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverButton = container.querySelector("button");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverButton?.textContent).toBe("Count: 0");

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(ButtonHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      const hydratedButton = container.querySelector("button");
      expect(hydratedButton).toBe(serverButton);
      expect(errors).not.toHaveBeenCalled();

      fireEvent.click(hydratedButton!);
      expect(hydratedButton?.textContent).toBe("Count: 1");
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});
