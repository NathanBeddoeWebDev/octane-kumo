/** @jsxImportSource octane */
import type { IconProps } from "@octanejs/phosphor-icons";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { createElement } from "octane";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Badge, badgeVariants } from "../src/components/badge/badge";
import { Empty, emptyVariants } from "../src/components/empty/empty";
import { SkeletonLine } from "../src/components/loader/skeleton-line";
import { Meter } from "../src/components/meter/meter";

afterEach(cleanup);

function TestIcon(props: IconProps) {
  return <svg data-testid="status-icon" data-kind={props["data-kind"]} />;
}

describe("Badge", () => {
  it("preserves filled, icon, and custom-class behavior", () => {
    render(Badge, {
      props: {
        children: "Healthy",
        className: "custom-badge",
        icon: TestIcon,
        variant: "success",
      },
    });

    const badge = screen
      .getByText("Healthy")
      .closest('[data-kumo-component="Badge"]')!;
    expect(badge.tagName).toBe("SPAN");
    expect(badge.classList.contains("bg-kumo-success-tint")).toBe(true);
    expect(badge.classList.contains("custom-badge")).toBe(true);
    expect(screen.getByTestId("status-icon")).toBeTruthy();
  });

  it("accepts an Octane icon descriptor", () => {
    render(Badge, {
      props: {
        children: "Next",
        icon: createElement(TestIcon, { "data-kind": "descriptor" }),
      },
    });

    expect(screen.getByTestId("status-icon").getAttribute("data-kind")).toBe(
      "descriptor",
    );
  });

  it("renders status dots without filled variant classes", () => {
    render(Badge, {
      props: {
        appearance: "dot",
        children: "Down",
        variant: "error",
      },
    });

    const badge = screen
      .getByText("Down")
      .closest('[data-kumo-component="Badge"]')!;
    const dot = badge.querySelector('[data-kumo-part="dot"]')!;
    expect(badge.classList.contains("bg-transparent")).toBe(true);
    expect(badge.classList.contains("bg-kumo-danger-tint")).toBe(false);
    expect(dot.classList.contains("bg-kumo-badge-red")).toBe(true);
    expect(dot.getAttribute("aria-hidden")).toBe("true");
  });

  it("retains base and link-hover styles in the variant helper", () => {
    const classes = badgeVariants({ variant: "outline" });
    expect(classes).toContain("rounded-full");
    expect(classes).toContain("[a:hover_&]:ring");
    expect(classes).toContain("border-kumo-fill");
  });
});

describe("SkeletonLine", () => {
  it("sets bounded shimmer variables and custom classes", () => {
    render(SkeletonLine, {
      props: {
        className: "custom-skeleton",
        maxDelay: 0.6,
        maxDuration: 2,
        maxWidth: 80,
        minDelay: 0.2,
        minDuration: 1,
        minWidth: 40,
      },
    });

    const line = document.querySelector<HTMLElement>(
      '[data-kumo-component="SkeletonLine"]',
    )!;
    const width = Number.parseInt(
      line.style.getPropertyValue("--skeleton-width"),
      10,
    );
    const duration = Number.parseFloat(
      line.style.getPropertyValue("--shimmer-duration"),
    );
    const delay = Number.parseFloat(
      line.style.getPropertyValue("--shimmer-delay"),
    );
    expect(line.classList.contains("skeleton-line")).toBe(true);
    expect(line.classList.contains("custom-skeleton")).toBe(true);
    expect(width).toBeGreaterThanOrEqual(40);
    expect(width).toBeLessThanOrEqual(80);
    expect(duration).toBeGreaterThanOrEqual(1);
    expect(duration).toBeLessThanOrEqual(2);
    expect(delay).toBeGreaterThanOrEqual(0.2);
    expect(delay).toBeLessThanOrEqual(0.6);
    expect(line.getAttribute("aria-hidden")).toBe("true");
  });

  it("centers a line inside a numeric block height", () => {
    render(SkeletonLine, {
      props: { blockHeight: 48, minWidth: 100, maxWidth: 100 },
    });

    const line = document.querySelector<HTMLElement>(
      '[data-kumo-component="SkeletonLine"]',
    )!;
    expect(line.parentElement?.style.height).toBe("48px");
    expect(line.parentElement?.classList.contains("items-center")).toBe(true);
  });
});

describe("Meter", () => {
  it("renders an accessible percentage and correctly sized indicator", () => {
    render(Meter, { props: { label: "Storage used", value: 65 } });

    const meter = screen.getByRole("meter", { name: "Storage used" });
    const indicator = meter.querySelector<HTMLElement>(
      '[data-kumo-part="indicator"]',
    )!;
    expect(meter.getAttribute("aria-valuenow")).toBe("65");
    expect(meter.getAttribute("aria-valuetext")).toBe("65%");
    expect(indicator.style.width).toBe("65%");
    expect(screen.getByText("65%").getAttribute("aria-hidden")).toBe("true");
  });

  it("honors ranges, custom values, hidden values, and part classes", () => {
    const { rerender } = render(Meter, {
      props: {
        customValue: "750 / 1,000",
        indicatorClassName: "custom-indicator",
        label: "API requests",
        max: 1000,
        trackClassName: "custom-track",
        value: 750,
      },
    });

    const meter = screen.getByRole("meter", { name: "API requests" });
    expect(screen.getByText("750 / 1,000")).toBeTruthy();
    expect(
      meter
        .querySelector('[data-kumo-part="track"]')
        ?.classList.contains("custom-track"),
    ).toBe(true);
    expect(
      meter
        .querySelector('[data-kumo-part="indicator"]')
        ?.classList.contains("custom-indicator"),
    ).toBe(true);
    expect(
      meter.querySelector<HTMLElement>('[data-kumo-part="indicator"]')?.style
        .width,
    ).toBe("75%");

    rerender({ props: { label: "API requests", showValue: false, value: 25 } });
    expect(screen.queryByText("25%")).toBeNull();
  });
});

describe("Empty", () => {
  it("renders its size, icon, description, and contents", () => {
    render(Empty, {
      props: {
        contents: <button type="button">Create resource</button>,
        description: "Create the first resource to get started.",
        icon: <span data-testid="empty-icon">◎</span>,
        size: "sm",
        title: "No resources",
      },
    });

    const empty = document.querySelector<HTMLElement>(
      '[data-kumo-component="Empty"]',
    )!;
    expect(screen.getByRole("heading", { name: "No resources" })).toBeTruthy();
    expect(screen.getByTestId("empty-icon")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Create resource" }),
    ).toBeTruthy();
    expect(empty.classList.contains("px-6")).toBe(true);
    expect(emptyVariants({ size: "lg" })).toContain("py-20");
  });

  it("copies command text and announces only successful copies", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(Empty, {
      props: { commandLine: "pnpm add octane-kumo", title: "Install Kumo" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("pnpm add octane-kumo");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
        "Copied command to clipboard",
      );
    });
  });
});
