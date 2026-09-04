/** @jsxImportSource octane */
import { afterEach, describe, expect, it } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import type { IconProps } from "@octanejs/phosphor-icons";
import { createElement } from "octane";
import {
  Button,
  LinkButton,
  RefreshButton,
  buttonVariants,
} from "../src/components/button/button";

afterEach(cleanup);

function TestIcon(props: IconProps) {
  return (
    <svg
      data-testid="test-icon"
      data-kind={props["data-kind"]}
      className={props.className}
    />
  );
}

describe("Button", () => {
  it("preserves the Kumo variant contract", () => {
    const primary = buttonVariants({ variant: "primary" });

    expect(primary).toContain("select-none");
    expect(primary).toContain("ring-(--kumo-button-emphasis-ring)");
    expect(primary).toContain("focus:ring-(--kumo-button-emphasis-ring)");
  });

  it("renders a native button with wrapped text and a safe default type", () => {
    render(Button, { props: { children: "Save" } });

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("data-kumo-component")).toBe("Button");
    expect(button.querySelector("span.contents")?.textContent).toBe("Save");
  });

  it("delivers a native click event", () => {
    let received: MouseEvent | undefined;
    render(Button, {
      props: {
        children: "Run",
        onClick: (event: MouseEvent) => {
          received = event;
        },
      },
    });

    fireEvent.click(screen.getByRole("button"));
    expect(received).toBeInstanceOf(MouseEvent);
  });

  it("forwards ref through the ref prop", () => {
    const ref: { current: HTMLButtonElement | null } = { current: null };
    render(Button, { props: { children: "Inspect", ref } });

    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("transitions into and out of loading state", () => {
    const { rerender } = render(Button, {
      props: { children: "Submit", loading: false },
    });

    expect(screen.queryByRole("status")).toBeNull();
    rerender({ props: { children: "Submit", loading: true } });
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
      "Loading",
    );
    rerender({ props: { children: "Submit", loading: false } });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("accepts both Octane icon components and element descriptors", () => {
    const { rerender } = render(Button, {
      props: { children: "Add", icon: TestIcon },
    });
    expect(screen.getByTestId("test-icon")).toBeTruthy();

    rerender({
      props: {
        children: "Add",
        icon: createElement(TestIcon, { "data-kind": "descriptor" }),
      },
    });
    expect(screen.getByTestId("test-icon").getAttribute("data-kind")).toBe(
      "descriptor",
    );
  });

  it("uses title as an accessible name without emitting a native title", () => {
    render(Button, {
      props: { icon: TestIcon, shape: "square", title: "Remove" },
    });

    const button = screen.getByRole("button", { name: "Remove" });
    expect(button.getAttribute("aria-label")).toBe("Remove");
    expect(button.getAttribute("title")).toBeNull();
    expect(button.hasAttribute("data-base-ui-tooltip-trigger")).toBe(true);
  });

  it("keeps the tooltip trigger enabled around a disabled button", () => {
    render(Button, {
      props: { children: "Save", disabled: true, title: "Unavailable" },
    });

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.parentElement?.tagName).toBe("SPAN");
    expect(
      button.parentElement?.hasAttribute("data-base-ui-tooltip-trigger"),
    ).toBe(true);
    expect(button.parentElement?.hasAttribute("disabled")).toBe(false);
  });
});

describe("RefreshButton", () => {
  it("provides a default accessible name", () => {
    render(RefreshButton);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  });
});

describe("LinkButton", () => {
  it("renders a selectable anchor and supports external links", () => {
    render(LinkButton, {
      props: {
        children: "Docs",
        external: true,
        href: "https://example.com",
      },
    });

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.classList.contains("select-text")).toBe(true);
  });

  it("forwards an anchor ref", () => {
    const ref: { current: HTMLAnchorElement | null } = { current: null };
    render(LinkButton, { props: { children: "Home", href: "/", ref } });

    expect(ref.current).toBe(screen.getByRole("link"));
  });

  it("renders a disabled button without anchor-only props or handlers", () => {
    let clicked = false;
    render(LinkButton, {
      props: {
        children: "Home",
        disabled: true,
        download: "home.html",
        href: "/home",
        onClick: () => {
          clicked = true;
        },
        rel: "noopener",
        target: "_blank",
      },
    });

    const button = screen.getByRole("button", { name: "Home" });
    expect(button.getAttribute("data-kumo-component")).toBe("LinkButton");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.hasAttribute("href")).toBe(false);
    expect(button.hasAttribute("target")).toBe(false);
    expect(button.hasAttribute("rel")).toBe(false);
    expect(button.hasAttribute("download")).toBe(false);
    fireEvent.click(button);
    expect(clicked).toBe(false);
  });
});
