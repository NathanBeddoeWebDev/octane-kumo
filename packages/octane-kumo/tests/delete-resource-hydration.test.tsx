/** @jsxImportSource octane */
import { act, fireEvent, screen, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { expect, it } from "vite-plus/test";
import { DeleteResourceFixture } from "./fixtures/delete-resource";
import { renderHydrationFixture } from "./hydration-ssr";

it("server-renders, adopts, and interacts with DeleteResource", async () => {
  const result = await renderHydrationFixture(
    "tests/fixtures/delete-resource.tsx",
    "DeleteResourceFixture",
  );
  const container = document.createElement("div");
  container.innerHTML = result.html;
  document.body.appendChild(container);
  const view = within(container);
  const trigger = view.getByRole("button", { name: "Delete edge worker" });
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, createElement(DeleteResourceFixture, {}));
    });
    expect(view.getByRole("button", { name: "Delete edge worker" })).toBe(
      trigger,
    );
    fireEvent.click(trigger);
    const input = await screen.findByRole("textbox");
    fireEvent.input(input, { target: { value: "edge-api-production" } });
    expect(
      (
        screen.getByRole("button", {
          name: "Delete Worker",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  } finally {
    root?.unmount();
    container.remove();
  }
}, 15000);
