/** @jsxImportSource octane */
import { Check, Copy } from "@octanejs/phosphor-icons";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import { Button } from "../button/button";
import { SkeletonLine } from "../loader/skeleton-line";
import { useLinkComponent } from "../../utils/link-provider";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

/** Breadcrumbs size variant definitions. */
export const KUMO_BREADCRUMBS_VARIANTS = {
  size: {
    sm: {
      classes: "text-sm h-10 gap-0.5",
      description: "Compact breadcrumbs for dense UIs",
    },
    base: {
      classes: "text-base h-12 gap-1",
      description: "Default breadcrumbs size",
    },
  },
} as const;

export const KUMO_BREADCRUMBS_DEFAULT_VARIANTS = {
  size: "base",
} as const;

export type KumoBreadcrumbsSize = keyof typeof KUMO_BREADCRUMBS_VARIANTS.size;

export interface KumoBreadcrumbsVariantsProps {
  /**
   * Size of the breadcrumbs.
   * - `"sm"` — Compact breadcrumbs for dense UIs
   * - `"base"` — Default breadcrumbs size
   * @default "base"
   */
  size?: KumoBreadcrumbsSize;
}

export function breadcrumbsVariants({
  size = KUMO_BREADCRUMBS_DEFAULT_VARIANTS.size,
}: KumoBreadcrumbsVariantsProps = {}) {
  return cn(
    "group mr-4 flex min-w-0 grow items-center overflow-hidden whitespace-nowrap",
    resolveVariant(
      KUMO_BREADCRUMBS_VARIANTS.size,
      size,
      KUMO_BREADCRUMBS_DEFAULT_VARIANTS.size,
    ).classes,
  );
}

export interface BreadcrumbsItemProps {
  href: string;
  icon?: OctaneNode;
}

export interface BreadcrumbsLinkProps extends BreadcrumbsItemProps {
  children?: OctaneNode;
}

function BreadcrumbsLink({ href, icon, children }: BreadcrumbsLinkProps) {
  const LinkComponent = useLinkComponent();

  return (
    <LinkComponent
      data-kumo-component="Breadcrumbs"
      data-kumo-part="link"
      to={href}
      // Ancestors do not shrink. Letting every crumb truncate proportionally
      // turns the whole trail into unreadable stubs ("Com… › Anal… › Acco…");
      // the current page is the only crumb allowed to give up width.
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap text-kumo-subtle no-underline",
      )}
    >
      {icon ? (
        <span className={cn("flex shrink-0 items-center")}>{icon}</span>
      ) : null}
      <span>{children}</span>
    </LinkComponent>
  );
}

BreadcrumbsLink.displayName = "Breadcrumbs.Link";

interface BreadcrumbsCurrentProps {
  children?: OctaneNode;
  loading?: boolean;
  icon?: OctaneNode;
}

function Current({ children, icon, loading }: BreadcrumbsCurrentProps) {
  if (loading) {
    return (
      <div className={cn("flex w-[125px] min-w-0 items-center gap-1")}>
        {icon ? (
          <span className={cn("flex shrink-0 items-center")}>{icon}</span>
        ) : null}
        <SkeletonLine />
      </div>
    );
  }

  return (
    <div
      className={cn("flex max-w-full min-w-0 items-center gap-1 font-medium")}
      aria-current="page"
    >
      {icon ? (
        <span className={cn("flex shrink-0 items-center")}>{icon}</span>
      ) : null}
      <span className={cn("truncate")}>{children}</span>
    </div>
  );
}

Current.displayName = "Breadcrumbs.Current";

function Separator() {
  return (
    <span
      className={cn("flex shrink-0 items-center text-kumo-inactive")}
      aria-hidden={true}
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M10.75 8.75L14.25 12L10.75 15.25"
        />
      </svg>
    </span>
  );
}

Separator.displayName = "Breadcrumbs.Separator";

function MobileEllipsis() {
  return (
    <span
      className={cn("flex shrink-0 items-center text-kumo-subtle")}
      aria-hidden={true}
    >
      ...
    </span>
  );
}

MobileEllipsis.displayName = "Breadcrumbs.MobileEllipsis";

function Clipboard({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timeoutId = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  const handleCopyDeeplink = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch (err) {
      console.error("Failed to copy deeplink:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      shape="square"
      size="sm"
      className={cn("opacity-0 transition-[opacity] group-hover:opacity-100")}
      onClick={handleCopyDeeplink}
      title="Click to copy"
      aria-label="Copy"
    >
      {isCopied ? (
        <Check weight="bold" className={cn("text-kumo-success")} />
      ) : (
        <Copy weight="regular" />
      )}
    </Button>
  );
}

Clipboard.displayName = "Breadcrumbs.Clipboard";

// Preserve the React source's local compound names while attaching them to the
// root via Object.assign (identical runtime shape to React's direct
// `Breadcrumb.Link = Link` assignments, but type-safe under `strict`).
const Link = BreadcrumbsLink;

function BreadcrumbRoot({ children, size = "base", className }: BreadcrumbsProps) {
  const childArray = Children.toArray(children);
  const mobileChildren = getMobileBreadcrumbChildren(childArray);

  return (
    <nav
      className={cn(breadcrumbsVariants({ size }), className)}
      aria-label="breadcrumb"
    >
      <div className={cn("contents sm:hidden")}>{mobileChildren}</div>
      <div className={cn("hidden sm:contents")}>{childArray}</div>
    </nav>
  );
}

BreadcrumbRoot.displayName = "Breadcrumbs";

/**
 * Breadcrumbs component props.
 *
 * @example
 * ```tsx
 * <Breadcrumbs>
 *   <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
 *   <Breadcrumbs.Separator />
 *   <Breadcrumbs.Link href="/docs">Docs</Breadcrumbs.Link>
 *   <Breadcrumbs.Separator />
 *   <Breadcrumbs.Current>Current Page</Breadcrumbs.Current>
 * </Breadcrumbs>
 * ```
 */
export interface BreadcrumbsProps
  extends KumoBreadcrumbsVariantsProps {
  children?: OctaneNode;
  /** Additional CSS classes merged via `cn()`. */
  className?: string;
}

/**
 * Navigation breadcrumb trail showing the current page's location in a hierarchy.
 * Compound component with `Breadcrumbs.Link`, `Breadcrumbs.Current`, `Breadcrumbs.Separator`, and `Breadcrumbs.Clipboard`.
 *
 * @example
 * ```tsx
 * <Breadcrumbs>
 *   <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
 *   <Breadcrumbs.Separator />
 *   <Breadcrumbs.Current>Dashboard</Breadcrumbs.Current>
 * </Breadcrumbs>
 * ```
 */
export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  Link,
  Current,
  Separator,
  Clipboard,
});

function isComponentElement(
  child: OctaneNode,
  component: unknown,
): child is ElementDescriptor {
  return isValidElement(child) && child.type === component;
}

function getMobileBreadcrumbChildren(children: OctaneNode[]): OctaneNode[] {
  const breadcrumbItems = children.filter(
    (child): child is ElementDescriptor =>
      isComponentElement(child, Link) || isComponentElement(child, Current),
  );

  if (breadcrumbItems.length <= 2) {
    return children;
  }

  const [parentItem, currentItem] = breadcrumbItems.slice(-2);
  const trailingItems: OctaneNode[] = [
    <MobileEllipsis key="kumo-breadcrumb-mobile-ellipsis" />,
    <Separator key="kumo-breadcrumb-mobile-separator-leading" />,
    cloneElement(parentItem, { key: "kumo-breadcrumb-mobile-parent" }),
    <Separator key="kumo-breadcrumb-mobile-separator-trailing" />,
    cloneElement(currentItem, { key: "kumo-breadcrumb-mobile-current" }),
  ];

  const extras = children.filter(
    (child) =>
      !isComponentElement(child, Link) &&
      !isComponentElement(child, Current) &&
      !isComponentElement(child, Separator),
  );

  return [...trailingItems, ...extras];
}
