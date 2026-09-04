/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createElement } from "octane";
import { Tooltip } from "../src/components/tooltip/tooltip";
import { KumoPortalProvider } from "../src/utils/portal-provider";

afterEach(cleanup);

describe("Tooltip", () => {
  it("opens on focus and closes on Escape", async () => {
    render(Tooltip, {
      props: {
        children: "Trigger",
        content: "More information",
        delay: 0,
      },
    });
    const trigger = screen.getByRole("button", { name: "Trigger" });

    expect(screen.queryByText("More information")).toBeNull();
    await act(async () => {
      trigger.focus();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(trigger.hasAttribute("data-popup-open")).toBe(true);
      expect(screen.getByText("More information")).toBeTruthy();
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(trigger.hasAttribute("data-popup-open")).toBe(false);
    });
  });

  it("passes trigger props and open state to a render callback", async () => {
    render(Tooltip, {
      props: {
        content: "Stateful content",
        delay: 0,
        render: (triggerProps, state) => (
          <button
            {...triggerProps}
            data-render-open={String(state.open)}
            type="button"
          >
            Stateful trigger
          </button>
        ),
      },
    });
    const trigger = screen.getByRole("button", { name: "Stateful trigger" });

    expect(trigger.getAttribute("data-render-open")).toBe("false");
    await act(async () => {
      trigger.focus();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(trigger.getAttribute("data-render-open")).toBe("true");
      expect(screen.getByText("Stateful content")).toBeTruthy();
    });
  });

  it("uses the Kumo portal container", async () => {
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);

    try {
      render(KumoPortalProvider, {
        props: {
          container: portalContainer,
          children: createElement(Tooltip, {
            children: "Portaled trigger",
            content: "Portaled content",
            delay: 0,
          }),
        },
      });

      await act(async () => {
        screen.getByRole("button", { name: "Portaled trigger" }).focus();
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(portalContainer.textContent).toContain("Portaled content");
      });
    } finally {
      portalContainer.remove();
    }
  });
});
