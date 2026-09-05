/** @jsxImportSource octane */
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { expect, it, vi } from "vite-plus/test";
import { FeedbackFixture } from "./fixtures/feedback";
import { renderHydrationFixture } from "./hydration-ssr";

it("adopts feedback controls and clipboard buttons, then dispatches, acts, copies and opens tooltips", async () => {
  const result = await renderHydrationFixture(
    "tests/fixtures/feedback.tsx",
    "FeedbackFixture",
  );
  const container = document.createElement("div");
  container.innerHTML = result.html;
  document.body.appendChild(container);
  const view = within(container);
  const trigger = view.getByRole("button", { name: "Show success" });
  const small = view.getByRole("button", { name: "Copy small" });
  const copy = view.getByRole("button", { name: "Copy resource ID" });
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(FeedbackFixture, {}));
    });
    expect(view.getByRole("button", { name: "Show success" })).toBe(trigger);
    expect(view.getByRole("button", { name: "Copy small" })).toBe(small);
    expect(view.getByRole("button", { name: "Copy resource ID" })).toBe(copy);
    fireEvent.click(trigger);
    expect(
      await screen.findByRole("dialog", { name: "success notification" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(view.getByText("Change undone")).toBeTruthy();
    await act(async () => {
      copy.focus();
    });
    const tooltip = await screen.findByRole("tooltip");
    expect(copy.getAttribute("aria-describedby")).toBe(tooltip.id);
    fireEvent.click(copy);
    await waitFor(() => expect(write).toHaveBeenCalledWith("resource-id-123"));
    await waitFor(() =>
      expect(document.body.textContent).toContain("Resource ID copied"),
    );
    fireEvent.click(small);
    await waitFor(() => expect(write).toHaveBeenCalledWith("Small field"));
    expect(errors).not.toHaveBeenCalled();
  } finally {
    root?.unmount();
    errors.mockRestore();
    write.mockRestore();
    container.remove();
  }
}, 15000);
