/** @jsxImportSource octane */
import { act, fireEvent, waitFor } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { ButtonHydrationFixture } from "./fixtures/button-hydration";
import { TooltipHydrationFixture } from "./fixtures/tooltip-hydration";
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

describe("Tooltip SSR and hydration", () => {
  it("adopts its trigger and opens after hydration", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/tooltip-hydration.tsx",
      "TooltipHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverTrigger = container.querySelector("button");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverTrigger?.textContent).toBe("Help");

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(TooltipHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      const hydratedTrigger = container.querySelector("button");
      expect(hydratedTrigger).toBe(serverTrigger);
      await act(async () => {
        hydratedTrigger?.focus();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(hydratedTrigger?.hasAttribute("data-popup-open")).toBe(true);
        expect(document.body.textContent).toContain("Hydrated help");
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});
