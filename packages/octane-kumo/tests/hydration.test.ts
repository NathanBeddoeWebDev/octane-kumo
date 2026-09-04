/** @jsxImportSource octane */
import { act, fireEvent, waitFor, within } from "@octanejs/testing-library";
import { createElement, hydrateRoot, type Root } from "octane";
import { describe, expect, it, vi } from "vite-plus/test";
import { ButtonHydrationFixture } from "./fixtures/button-hydration";
import { CollapsibleHydrationFixture } from "./fixtures/collapsible-hydration";
import { FormHydrationFixture } from "./fixtures/form-hydration";
import { NavigationHydrationFixture } from "./fixtures/navigation-hydration";
import {
  DialogHydrationFixture,
  DropdownHydrationFixture,
  PopoverHydrationFixture,
} from "./fixtures/overlay-hydration";
import { StatusHydrationFixture } from "./fixtures/status-hydration";
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

describe("Status and disclosure SSR and hydration", () => {
  it("adopts status markup and preserves copy interaction", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/status-hydration.tsx",
      "StatusHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverBadge = container.querySelector(
      '[data-kumo-component="Badge"]',
    );
    const serverSkeleton = container.querySelector(
      '[data-kumo-component="SkeletonLine"]',
    ) as HTMLElement | null;
    const serverSkeletonStyles = [
      "--skeleton-width",
      "--shimmer-duration",
      "--shimmer-delay",
    ].map((property) => serverSkeleton?.style.getPropertyValue(property));
    const serverMeter = container.querySelector(
      '[data-kumo-component="Meter"]',
    );
    const serverEmpty = container.querySelector(
      '[data-kumo-component="Empty"]',
    );
    const serverCopy = within(container).getByRole("button", {
      name: "Copy command",
    });
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverMeter?.getAttribute("aria-valuenow")).toBe("65");

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(StatusHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      expect(container.querySelector('[data-kumo-component="Badge"]')).toBe(
        serverBadge,
      );
      const hydratedSkeleton = container.querySelector(
        '[data-kumo-component="SkeletonLine"]',
      ) as HTMLElement | null;
      expect(hydratedSkeleton).toBe(serverSkeleton);
      expect(
        ["--skeleton-width", "--shimmer-duration", "--shimmer-delay"].map(
          (property) => hydratedSkeleton?.style.getPropertyValue(property),
        ),
      ).toEqual(serverSkeletonStyles);
      expect(container.querySelector('[data-kumo-component="Meter"]')).toBe(
        serverMeter,
      );
      expect(container.querySelector('[data-kumo-component="Empty"]')).toBe(
        serverEmpty,
      );
      expect(
        within(container).getByRole("button", { name: "Copy command" }),
      ).toBe(serverCopy);

      await act(async () => {
        fireEvent.click(serverCopy);
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(
          within(container).getByRole("button", { name: "Copied" }),
        ).toBeTruthy();
      });
      expect(writeText).toHaveBeenCalledWith("pnpm add octane-kumo");
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });

  it("opens an initially closed disclosure after hydration", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/collapsible-hydration.tsx",
      "CollapsibleHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverTrigger = within(container).getByRole("button", {
      name: "Hydrated details",
    });
    const serverPanel = within(container)
      .getByText("Hydrated disclosure content")
      .closest('[data-kumo-part="panel"]');
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverTrigger.getAttribute("aria-expanded")).toBe("false");
      expect(serverPanel?.hasAttribute("hidden")).toBe(true);

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(CollapsibleHydrationFixture, {}),
        );
        await Promise.resolve();
      });
      expect(
        within(container).getByRole("button", { name: "Hydrated details" }),
      ).toBe(serverTrigger);

      fireEvent.click(serverTrigger);
      await waitFor(() => {
        expect(
          within(container).getByText("Hydrated disclosure content"),
        ).toBeTruthy();
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});

describe("Form controls SSR and hydration", () => {
  it("adopts native form-control markup and remains interactive", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/form-hydration.tsx",
      "FormHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverInput = container.querySelector<HTMLInputElement>(
      'input[name="worker"]',
    );
    const serverCheckbox = container.querySelector<HTMLButtonElement>(
      '[data-kumo-component="Checkbox"]',
    );
    const serverInputArea = container.querySelector<HTMLTextAreaElement>(
      'textarea[name="notes"]',
    );
    const serverInputGroup = container.querySelector<HTMLInputElement>(
      'input[name="query"]',
    );
    const serverSensitiveInput = container.querySelector<HTMLInputElement>(
      'input[name="secret"]',
    );
    const serverSensitiveContainer = container.querySelector<HTMLDivElement>(
      '[data-kumo-part="masked-container"]',
    );
    const serverSwitch = container.querySelector<HTMLButtonElement>(
      '[data-kumo-component="Switch"]',
    );
    const serverRadio = container.querySelector<HTMLButtonElement>(
      '[data-kumo-part="item"][role="radio"]',
    );
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverInput?.value).toBe("worker");
      expect(serverInputArea?.value).toBe("Runs globally");
      expect(serverInputGroup?.value).toBe("workers");
      expect(serverSensitiveInput?.value).toBe("token");
      expect(serverSensitiveContainer?.getAttribute("role")).toBe("button");
      expect(serverCheckbox?.getAttribute("aria-checked")).toBe("false");
      expect(serverSwitch?.getAttribute("aria-checked")).toBe("false");
      expect(serverRadio?.getAttribute("aria-checked")).toBe("true");

      await act(async () => {
        root = hydrateRoot(container, createElement(FormHydrationFixture, {}));
        await Promise.resolve();
      });

      const hydratedInput = container.querySelector<HTMLInputElement>(
        'input[name="worker"]',
      );
      const hydratedCheckbox = container.querySelector<HTMLButtonElement>(
        '[data-kumo-component="Checkbox"]',
      );
      const hydratedInputArea = container.querySelector<HTMLTextAreaElement>(
        'textarea[name="notes"]',
      );
      const hydratedInputGroup = container.querySelector<HTMLInputElement>(
        'input[name="query"]',
      );
      const hydratedSensitiveInput = container.querySelector<HTMLInputElement>(
        'input[name="secret"]',
      );
      const hydratedSensitiveContainer =
        container.querySelector<HTMLDivElement>(
          '[data-kumo-part="masked-container"]',
        );
      const hydratedSwitch = container.querySelector<HTMLButtonElement>(
        '[data-kumo-component="Switch"]',
      );
      const hydratedRadio = container.querySelector<HTMLButtonElement>(
        '[data-kumo-part="item"][role="radio"]',
      );
      expect(hydratedInput).toBe(serverInput);
      expect(hydratedCheckbox).toBe(serverCheckbox);
      expect(hydratedInputArea).toBe(serverInputArea);
      expect(hydratedInputGroup).toBe(serverInputGroup);
      expect(hydratedSensitiveInput).toBe(serverSensitiveInput);
      expect(hydratedSensitiveContainer).toBe(serverSensitiveContainer);
      expect(hydratedSwitch).toBe(serverSwitch);
      expect(hydratedRadio).toBe(serverRadio);

      await act(async () => {
        fireEvent.input(hydratedInput!, { target: { value: "api-worker" } });
        fireEvent.input(hydratedInputArea!, {
          target: { value: "Deploy from Git" },
        });
        fireEvent.input(hydratedInputGroup!, {
          target: { value: "durable objects" },
        });
        fireEvent.click(hydratedSensitiveContainer!);
        fireEvent.input(hydratedSensitiveInput!, {
          target: { value: "new-token" },
        });
        fireEvent.click(hydratedCheckbox!);
        fireEvent.click(
          within(container).getByRole("checkbox", { name: "SMS" }),
        );
        fireEvent.click(hydratedSwitch!);
        fireEvent.click(
          within(container).getByRole("radio", { name: "Europe" }),
        );
        await Promise.resolve();
      });

      expect(
        container.querySelector('[data-testid="worker-value"]')?.textContent,
      ).toBe("api-worker");
      expect(
        container.querySelector('[data-testid="notes-value"]')?.textContent,
      ).toBe("Deploy from Git");
      expect(
        container.querySelector('[data-testid="query-value"]')?.textContent,
      ).toBe("durable objects");
      expect(
        container.querySelector('[data-testid="secret-value"]')?.textContent,
      ).toBe("new-token");
      expect(
        container.querySelector('[data-testid="enabled-value"]')?.textContent,
      ).toBe("true");
      expect(
        container.querySelector('[data-testid="channels-value"]')?.textContent,
      ).toBe("email,sms");
      expect(
        container.querySelector('[data-testid="deploys-value"]')?.textContent,
      ).toBe("true");
      expect(
        container.querySelector('[data-testid="region-value"]')?.textContent,
      ).toBe("europe");
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});

describe("Overlay SSR and hydration", () => {
  it("adopts a closed dialog trigger and opens after hydration", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/overlay-hydration.tsx",
      "DialogHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverDialogTrigger = within(container).getByRole("button", {
      name: "Hydrated dialog",
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(DialogHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      expect(
        within(container).getByRole("button", { name: "Hydrated dialog" }),
      ).toBe(serverDialogTrigger);
      fireEvent.click(serverDialogTrigger);
      await waitFor(() => {
        expect(
          within(document.body).getByRole("dialog", {
            name: "Hydrated dialog title",
          }),
        ).toBeTruthy();
      });
      fireEvent.click(
        within(document.body).getByRole("button", { name: "Close dialog" }),
      );
      await waitFor(() => {
        expect(
          within(document.body).queryByRole("dialog", {
            name: "Hydrated dialog title",
          }),
        ).toBeNull();
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });

  it("adopts a closed popover trigger and opens after hydration", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/overlay-hydration.tsx",
      "PopoverHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverPopoverTrigger = within(container).getByRole("button", {
      name: "Hydrated popover",
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(PopoverHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      expect(
        within(container).getByRole("button", { name: "Hydrated popover" }),
      ).toBe(serverPopoverTrigger);

      fireEvent.click(serverPopoverTrigger);
      await waitFor(() => {
        expect(
          within(document.body).getByRole("dialog", {
            name: "Hydrated popover title",
          }),
        ).toBeTruthy();
      });
      fireEvent.click(
        within(document.body).getByRole("button", { name: "Close popover" }),
      );
      await waitFor(() => {
        expect(
          within(document.body).queryByRole("dialog", {
            name: "Hydrated popover title",
          }),
        ).toBeNull();
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });

  it("adopts a closed menu trigger and opens after hydration", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/overlay-hydration.tsx",
      "DropdownHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverMenuTrigger = within(container).getByRole("button", {
      name: "Hydrated menu",
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(DropdownHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      expect(
        within(container).getByRole("button", { name: "Hydrated menu" }),
      ).toBe(serverMenuTrigger);

      fireEvent.click(serverMenuTrigger);
      await waitFor(() => {
        expect(
          within(document.body).getByRole("menuitem", { name: "Run action" }),
        ).toBeTruthy();
      });
      fireEvent.click(
        within(document.body).getByRole("menuitem", { name: "Run action" }),
      );
      await waitFor(() => {
        expect(
          within(container).getByTestId("overlay-actions").textContent,
        ).toBe("1");
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});

describe("Navigation controls SSR and hydration", () => {
  it("adopts tabs, toolbar, and menubar markup and remains interactive", async () => {
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/navigation-hydration.tsx",
      "NavigationHydrationFixture",
    );
    const container = document.createElement("div");
    container.innerHTML = serverResult.html;
    document.body.appendChild(container);
    const serverOverview = within(container).getByRole("tab", {
      name: "Hydrated overview",
    });
    const serverToolbarButton = within(container).getByRole("button", {
      name: "Run hydrated action",
    });
    const serverMenuButton = within(container).getByRole("button", {
      name: "Hydrated grid view",
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      expect(serverOverview.getAttribute("aria-selected")).toBe("true");

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(NavigationHydrationFixture, {}),
        );
        await Promise.resolve();
      });

      expect(
        within(container).getByRole("tab", { name: "Hydrated overview" }),
      ).toBe(serverOverview);
      expect(
        within(container).getByRole("button", {
          name: "Run hydrated action",
        }),
      ).toBe(serverToolbarButton);
      expect(
        within(container).getByRole("button", { name: "Hydrated grid view" }),
      ).toBe(serverMenuButton);

      fireEvent.click(
        within(container).getByRole("tab", { name: "Hydrated settings" }),
      );
      fireEvent.click(serverToolbarButton);
      fireEvent.click(serverMenuButton);

      await waitFor(() => {
        expect(
          within(container).getByTestId("hydrated-tab-value").textContent,
        ).toBe("settings");
        expect(
          within(container).getByTestId("hydrated-toolbar-actions").textContent,
        ).toBe("1");
        expect(
          within(container).getByTestId("hydrated-menu-value").textContent,
        ).toBe("grid");
      });
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root?.unmount();
      errors.mockRestore();
      container.remove();
    }
  });
});
