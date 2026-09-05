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
import { CommandPaletteFixture } from "./fixtures/command-palette";
import { renderHydrationFixture } from "./hydration-ssr";

it("adopts the server trigger then opens, searches and selects after hydration", async () => {
  const { html } = await renderHydrationFixture(
    "tests/fixtures/command-palette.tsx",
    "CommandPaletteFixture",
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  const trigger = within(container).getByRole("button", {
    name: "Open commands",
  });
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(CommandPaletteFixture, {}));
    });
    expect(
      within(container).getByRole("button", { name: "Open commands" }),
    ).toBe(trigger);
    trigger.focus();
    fireEvent.click(trigger);
    const input = await screen.findByRole("searchbox");
    fireEvent.input(input, { target: { value: "Billing" } });
    const option = await screen.findByRole("option", {
      name: "Account Billing",
    });
    fireEvent.click(option);
    await waitFor(() =>
      expect(container.querySelector("output")?.textContent).toBe("Billing"),
    );
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(errors).not.toHaveBeenCalled();
  } finally {
    root?.unmount();
    container.remove();
    errors.mockRestore();
  }
}, 15000);
