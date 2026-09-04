/** @jsxImportSource octane */
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import type { JSX } from "octane/jsx-runtime";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Banner, bannerVariants } from "../src/components/banner/banner";
import { Breadcrumb as Breadcrumbs } from "../src/components/breadcrumbs/breadcrumbs";
import { CloudflareLogo } from "../src/components/cloudflare-logo/cloudflare-logo";
import { Grid, GridItem } from "../src/components/grid/grid";
import { LayerCard } from "../src/components/layer-card/layer-card";
import { Link } from "../src/components/link/link";
import { Sidebar } from "../src/components/sidebar/sidebar";
import { Surface } from "../src/components/surface/surface";
import { TableOfContents } from "../src/components/table-of-contents/table-of-contents";
import { Text } from "../src/components/text/text";

afterEach(cleanup);

describe("LayerCard and Surface", () => {
  it("renders simple and layered cards with variant helpers", () => {
    render(LayerCard, { props: { children: "Card content" } });
    expect(screen.getByText("Card content").tagName).toBe("DIV");

    cleanup();
    render(LayerCard, {
      props: {
        children: (
          <>
            <LayerCard.Secondary>Next steps</LayerCard.Secondary>
            <LayerCard.Primary>Seen</LayerCard.Primary>
          </>
        ),
      },
    });
    expect(screen.getByText("Next steps")).toBeTruthy();
    expect(screen.getByText("Seen")).toBeTruthy();
  });

  it("preserves the deprecated Surface compat wrapper", () => {
    render(Surface, { props: { children: "Surface content" } });
    const surface = screen.getByText("Surface content");
    expect(surface.getAttribute("data-deprecated")).toBe("surface");
    expect(surface.getAttribute("data-surface-color")).toBe("primary");
  });

  it("supports callback render composition for LayerCard and Surface", () => {
    let layerCardState: Record<string, never> | undefined;
    render(LayerCard, {
      props: {
        children: "Composed card",
        render: (props, state) => {
          layerCardState = state;
          return <article {...props} data-testid="composed-card" />;
        },
      },
    });
    expect(screen.getByTestId("composed-card").tagName).toBe("ARTICLE");
    expect(layerCardState).toEqual({});

    cleanup();
    render(Surface, {
      props: {
        children: "Composed surface",
        render: (props) => (
          <section {...props} data-testid="composed-surface" />
        ),
      },
    });
    expect(screen.getByTestId("composed-surface").tagName).toBe("SECTION");
  });

  it("composes LayerCard element props, handlers, styles, and refs", () => {
    const calls: string[] = [];
    const elementRef = { current: null as HTMLDivElement | null };
    const forwardedRef = { current: null as HTMLDivElement | null };

    render(LayerCard, {
      props: {
        children: "Composed behavior",
        ref: forwardedRef,
        onClick: () => calls.push("component"),
        style: { backgroundColor: "black", color: "red" },
        render: (
          <article
            ref={elementRef}
            data-testid="composed-behavior"
            onClick={() => calls.push("element")}
            style={{ borderColor: "green", color: "blue" }}
          />
        ),
      },
    });

    const card = screen.getByTestId("composed-behavior");
    fireEvent.click(card);
    expect(calls).toEqual(["element", "component"]);
    expect(card.style.backgroundColor).toBe("black");
    expect(card.style.borderColor).toBe("green");
    expect(card.style.color).toBe("blue");
    expect(elementRef.current).toBe(card);
    expect(forwardedRef.current).toBe(card);
  });
});

describe("Grid", () => {
  it("renders responsive columns and items", () => {
    render(Grid, {
      props: {
        variant: "2up",
        children: (
          <>
            <GridItem>Left</GridItem>
            <GridItem>Right</GridItem>
          </>
        ),
      },
    });
    expect(screen.getByText("Left")).toBeTruthy();
    expect(screen.getByText("Right")).toBeTruthy();
  });
});

describe("Text and Link", () => {
  it("renders body and heading text", () => {
    render(Text, { props: { variant: "body", children: "Body copy" } });
    expect(screen.getByText("Body copy").tagName).toBe("P");

    cleanup();
    render(Text, {
      props: { variant: "heading", as: "h2", children: "Section" },
    });
    expect(screen.getByRole("heading", { name: "Section" })).toBeTruthy();
  });

  it("renders an inline link with kumo marker", () => {
    render(Link, { props: { href: "/docs", children: "Learn more" } });
    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.getAttribute("data-kumo-component")).toBe("Link");
  });

  it("supports callback render composition", () => {
    let renderState: Record<string, never> | undefined;
    function RouterLink(props: JSX.IntrinsicElements["a"]) {
      return <a {...props} data-router-link="true" />;
    }

    render(Link, {
      props: {
        href: "/router",
        children: "Router link",
        render: (props, state) => {
          renderState = state;
          return <RouterLink {...props} />;
        },
      },
    });

    const link = screen.getByRole("link", { name: "Router link" });
    expect(link.getAttribute("data-router-link")).toBe("true");
    expect(renderState).toEqual({});
  });

  it("composes Link element props, handlers, styles, and refs", () => {
    const calls: string[] = [];
    const elementRef = { current: null as HTMLAnchorElement | null };
    const forwardedRef = { current: null as HTMLAnchorElement | null };

    render(Link, {
      props: {
        href: "/merged",
        children: "Merged link",
        ref: forwardedRef,
        onClick: () => calls.push("component"),
        style: { backgroundColor: "black", color: "red" },
        render: (
          <a
            ref={elementRef}
            onClick={() => calls.push("element")}
            style={{ borderColor: "green", color: "blue" }}
          />
        ),
      },
    });

    const link = screen.getByRole("link", { name: "Merged link" });
    fireEvent.click(link);
    expect(calls).toEqual(["element", "component"]);
    expect(link.style.backgroundColor).toBe("black");
    expect(link.style.borderColor).toBe("green");
    expect(link.style.color).toBe("blue");
    expect(elementRef.current).toBe(link);
    expect(forwardedRef.current).toBe(link);
  });
});

describe("Banner and Breadcrumbs", () => {
  it("renders structured banner variants", () => {
    render(Banner, {
      props: { title: "Update available", description: "Ready to install." },
    });
    expect(screen.getByText("Update available")).toBeTruthy();
    expect(bannerVariants({ variant: "alert" })).toContain(
      "bg-kumo-warning-tint",
    );
  });

  it("inlines only the Kumo Link action in compact banners", () => {
    render(Banner, {
      props: {
        size: "sm",
        title: "Update available",
        description: "Ready to install.",
        action: <Link href="/update">Install now</Link>,
      },
    });
    const description = screen.getByText("Ready to install.");
    expect(
      description.contains(screen.getByRole("link", { name: "Install now" })),
    ).toBe(true);

    cleanup();
    const UnrelatedLink = Object.assign(
      (props: JSX.IntrinsicElements["button"]) => <button {...props} />,
      { displayName: "Link" },
    );
    render(Banner, {
      props: {
        size: "sm",
        title: "Update available",
        description: "Ready to install.",
        action: <UnrelatedLink>Not a link</UnrelatedLink>,
      },
    });
    const unrelatedDescription = screen.getByText("Ready to install.");
    expect(
      unrelatedDescription.contains(
        screen.getByRole("button", { name: "Not a link" }),
      ),
    ).toBe(false);
  });

  it("renders a breadcrumb trail with current page", () => {
    render(Breadcrumbs, {
      props: {
        children: (
          <>
            <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
            <Breadcrumbs.Separator />
            <Breadcrumbs.Current>Current page</Breadcrumbs.Current>
          </>
        ),
      },
    });
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeTruthy();
    const currents = screen.getAllByText("Current page");
    expect(currents.length).toBeGreaterThan(0);
    expect(currents[0].closest('[aria-current="page"]')).toBeTruthy();
  });
});

describe("CloudflareLogo and TableOfContents", () => {
  it("renders the glyph logo", () => {
    render(CloudflareLogo, { props: { variant: "glyph" } });
    expect(
      document.querySelector('svg[aria-label="Cloudflare logo"]'),
    ).toBeTruthy();
  });

  it("renders a table of contents", () => {
    render(TableOfContents, {
      props: {
        children: (
          <>
            <TableOfContents.Title>On this page</TableOfContents.Title>
            <TableOfContents.List>
              <TableOfContents.Item href="#overview">
                Overview
              </TableOfContents.Item>
            </TableOfContents.List>
          </>
        ),
      },
    });
    expect(screen.getByText("On this page")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
  });
});

describe("Sidebar", () => {
  it("renders provider with menu content", () => {
    render(Sidebar.Provider, {
      props: {
        children: (
          <Sidebar>
            <Sidebar.Header>Header</Sidebar.Header>
            <Sidebar.Content>
              <Sidebar.Menu>
                <Sidebar.MenuButton>Home</Sidebar.MenuButton>
              </Sidebar.Menu>
            </Sidebar.Content>
            <Sidebar.Footer>Footer</Sidebar.Footer>
          </Sidebar>
        ),
      },
    });
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });
});
