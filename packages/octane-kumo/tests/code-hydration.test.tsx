/** @jsxImportSource octane */
import { act, fireEvent, waitFor, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { highlightCode } from "../src/code/server";
import { CodeFixture, ServerCodeFixture, source } from "./fixtures/code";
import { renderHydrationFixture } from "./hydration-ssr";

describe("code SSR and hydration", () => {
  it("adopts escaped fallback and controls, then highlights and copies after hydration", async () => {
    const result = await renderHydrationFixture(
      "tests/fixtures/code.tsx",
      "CodeFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = result.html;
    document.body.appendChild(container);
    const view = within(container);
    const fixture = view.getByTestId("code-fixture");
    const legacy = container.querySelector("pre");
    const button = view.getByRole("button", { name: "Copy" });
    expect(container.querySelector(".shiki")).toBeNull();
    expect(container.querySelector("code")?.textContent?.trim()).toBe(source);
    expect(container.querySelector("hello")).toBeNull();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(CodeFixture, {}));
      });
      expect(view.getByTestId("code-fixture")).toBe(fixture);
      expect(container.querySelector("pre")).toBe(legacy);
      expect(view.getByRole("button", { name: "Copy" })).toBe(button);
      await waitFor(() =>
        expect(container.querySelectorAll(".shiki")).toHaveLength(2),
      );
      expect(container.querySelectorAll(".line-highlighted")).toHaveLength(1);
      fireEvent.click(button);
      await view.findByRole("button", { name: "Copied!" });
      expect(write).toHaveBeenCalledWith(source);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      write.mockRestore();
      container.remove();
    }
  }, 15000);

  it("server-renders and adopts pre-highlighted trusted HTML without a provider", async () => {
    const html = await highlightCode(source, "typescript");
    const result = await renderHydrationFixture(
      "tests/fixtures/code.tsx",
      "ServerCodeFixture",
      { html },
    );
    const container = document.createElement("div");
    container.innerHTML = result.html;
    document.body.appendChild(container);
    const pre = container.querySelector("pre");
    const code = container.querySelector("code");
    expect(code?.textContent).toBe(source);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(ServerCodeFixture, { html }),
        );
      });
      expect(container.querySelector("pre")).toBe(pre);
      expect(container.querySelector("code")).toBe(code);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  }, 15000);
});
