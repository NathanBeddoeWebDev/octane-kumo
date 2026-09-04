/** @jsxImportSource octane */
import { useRender } from "@octanejs/base-ui/use-render";
import { useEffect, type ElementDescriptor, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import {
  useLinkComponent,
  type LinkComponentProps,
} from "../../utils/link-provider";

/**
 * ExternalIcon - Visual indicator for links that open in a new tab/window.
 *
 * Use this as a child of Link to indicate external navigation:
 * ```tsx
 * <Link href="https://example.com" target="_blank" rel="noopener noreferrer">
 *   Visit Example <Link.ExternalIcon />
 * </Link>
 * ```
 */
const ExternalIcon = Object.assign(
  function ExternalIcon(props: JSX.IntrinsicElements["svg"]) {
    return (
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="link-external-icon"
        {...props}
      >
        <path d="M9 4H8.8C7.11984 4 6.27976 4 5.63803 4.32698C5.07354 4.6146 4.6146 5.07354 4.32698 5.63803C4 6.27976 4 7.11984 4 8.8V15.2C4 16.8802 4 17.7202 4.32698 18.362C4.6146 18.9265 5.07354 19.3854 5.63803 19.673C6.27976 20 7.11984 20 8.8 20H15.2C16.8802 20 17.7202 20 18.362 19.673C18.9265 19.3854 19.3854 18.9265 19.673 18.362C20 17.7202 20 16.8802 20 15.2V15" />
        <path d="M14 4H20M20 4V10M20 4L11 13" />
      </svg>
    );
  },
  { displayName: "Link.ExternalIcon" },
);

/** Link variant definitions mapping variant names to their Tailwind classes. */
export const KUMO_LINK_VARIANTS = {
  variant: {
    inline: {
      classes:
        // text-kumo-link provides defensive color that won't be overridden by global `a` styles
        "text-kumo-link underline underline-offset-[0.15em] decoration-[0.0625em] link-current transition-colors",
      description: "Inline text link that flows with content",
    },
    current: {
      classes:
        "text-current underline underline-offset-[0.15em] decoration-[0.0625em] link-current transition-colors",
      description: "Link that inherits color from parent text",
    },
    plain: {
      classes:
        // text-kumo-link provides defensive color that won't be overridden by global `a` styles
        "text-kumo-link hover:text-kumo-link/70 transition-colors",
      description: "Link without underline decoration",
    },
  },
} as const;

export const KUMO_LINK_DEFAULT_VARIANTS = {
  variant: "inline",
} as const;

export type KumoLinkVariant = keyof typeof KUMO_LINK_VARIANTS.variant;

export interface KumoLinkVariantsProps {
  /**
   * Visual style of the link.
   * - `"inline"` — Inline text link that flows with content
   * - `"current"` — Link that inherits color from parent text
   * - `"plain"` — Link without underline decoration
   * @default "inline"
   */
  variant?: KumoLinkVariant;
}

export function linkVariants({
  variant = KUMO_LINK_DEFAULT_VARIANTS.variant,
}: KumoLinkVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_LINK_VARIANTS.variant,
      variant,
      KUMO_LINK_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

/**
 * Link component props.
 *
 * Use `href` for the link destination. For framework-specific routing, use the
 * `render` prop or configure a `LinkProvider` at the app root.
 *
 * @example Internal link
 * ```tsx
 * <Link href="/docs">Learn more</Link>
 * ```
 *
 * @example External link
 * ```tsx
 * <Link href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
 *   Visit Cloudflare <Link.ExternalIcon />
 * </Link>
 * ```
 *
 * @example Composition with render prop
 * ```tsx
 * <Link render={<RouterLink to="/dashboard" />}>Dashboard</Link>
 * ```
 */
export type LinkProps = Omit<
  JSX.IntrinsicElements["a"],
  "children" | "className"
> &
  LinkComponentProps &
  KumoLinkVariantsProps & {
    children?: OctaneNode;
    className?: string;
    /**
     * Element or callback used to render the link. Props, handlers, styles,
     * and refs are composed with the rendered element.
     */
    render?:
      | ElementDescriptor
      | ((
          props: JSX.IntrinsicElements["a"],
          state: Record<string, never>,
        ) => ElementDescriptor);
  };

/**
 * Link component for consistent inline text links.
 *
 * Link is a **presentational component** — it handles visual styling and
 * accessibility. Routing behavior belongs in the application layer, via
 * either the `render` prop or a `LinkProvider`.
 *
 * - Without `render`: renders via LinkProvider (default `<a>` or configured component)
 * - With `render`: merges props onto the provided element with proper ref/event handling
 *
 * @example Basic usage
 * ```tsx
 * <Link href="/docs">Learn more</Link>
 * ```
 *
 * @example External link with icon
 * ```tsx
 * <Link href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
 *   Visit Cloudflare <Link.ExternalIcon />
 * </Link>
 * ```
 *
 * @example Composition with React Router via render prop
 * ```tsx
 * <Link render={<RouterLink to="/dashboard" />} variant="inline">
 *   Dashboard
 * </Link>
 * ```
 *
 * @example Composition via LinkProvider (recommended for app-wide routing)
 * ```tsx
 * // App root:
 * <LinkProvider component={AppLink}>
 *   <App />
 * </LinkProvider>
 *
 * // Then use href everywhere:
 * <Link href="/dashboard">Dashboard</Link>
 * <Link href="https://example.com" target="_blank">External</Link>
 * ```
 */
function LinkBase({
  className,
  variant = "inline",
  render,
  ref,
  ...props
}: LinkProps) {
  const LinkComponent = useLinkComponent();

  // Unconditional hook (Octane follows React hook rules); the dev-only
  // warning fires once on mount, matching the React one-time warning.
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      "to" in props &&
      (props as { to?: unknown }).to !== undefined
    ) {
      console.warn(
        "[kumo] Link: The `to` prop is deprecated. Use `href` instead.\n\n" +
          "If your app uses a client-side router, configure a LinkProvider that\n" +
          "maps `href` to your router's navigation prop. See:\n" +
          "https://kumo.cfops.it/utilities/link-provider\n\n" +
          "Migration example:\n" +
          '  Before: <Link to="/page">…</Link>\n' +
          '  After:  <Link href="/page">…</Link>',
      );
    }
  }, []);

  const baseClassName = cn(
    linkVariants({ variant }),
    "group/link inline-flex items-center gap-[0.1875em]",
  );

  return useRender({
    render: render ?? <LinkComponent />,
    ref,
    props: [
      {
        "data-kumo-component": "Link",
        className: baseClassName,
      },
      props,
      { className },
    ],
  });
}

// Compound component with ExternalIcon subcomponent
export const Link = Object.assign(LinkBase, {
  ExternalIcon,
  displayName: "Link",
});
