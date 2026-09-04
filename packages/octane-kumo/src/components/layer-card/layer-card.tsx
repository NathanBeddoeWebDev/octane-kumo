/** @jsxImportSource octane */
import { useRender } from "@octanejs/base-ui/use-render";
import {
  Children,
  Fragment,
  isValidElement,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";

const LAYER_CARD_SURFACE_CLASSES =
  "overflow-hidden rounded-lg bg-kumo-base shadow-xs ring ring-kumo-line";
const LAYER_CARD_LAYERED_ROOT_CLASSES =
  "flex w-full flex-col overflow-hidden rounded-lg bg-kumo-elevated text-base ring ring-kumo-hairline";
const LAYER_CARD_SECONDARY_CLASSES =
  "-my-2 flex items-center gap-2 bg-kumo-elevated p-4 text-base font-medium text-kumo-subtle";
const LAYER_CARD_PRIMARY_CLASSES =
  "relative flex flex-col gap-2 overflow-hidden rounded-lg bg-kumo-base p-4 pr-3 text-inherit no-underline ring ring-kumo-fill";

/** LayerCard variant definitions (currently empty, reserved for future additions). */
export const KUMO_LAYER_CARD_VARIANTS = {
  // LayerCard currently has no variant options but structure is ready for future additions
} as const;

export const KUMO_LAYER_CARD_DEFAULT_VARIANTS = {} as const;

// Derived types from KUMO_LAYER_CARD_VARIANTS
export interface KumoLayerCardVariantsProps {}

export function layerCardVariants(_props: KumoLayerCardVariantsProps = {}) {
  return cn(LAYER_CARD_SURFACE_CLASSES);
}

/**
 * LayerCard component props.
 *
 * @example
 * ```tsx
 * <LayerCard className="p-4">
 *   Get started with Kumo
 * </LayerCard>
 *
 * <LayerCard>
 *   <LayerCard.Secondary>Next Steps</LayerCard.Secondary>
 *   <LayerCard.Primary>Get started with Kumo</LayerCard.Primary>
 * </LayerCard>
 * ```
 */
export type LayerCardProps = Omit<JSX.IntrinsicElements["div"], "children"> &
  KumoLayerCardVariantsProps & {
    children?: OctaneNode;
    className?: string;
    render?:
      | ElementDescriptor
      | ((
          props: JSX.IntrinsicElements["article"],
          state: Record<string, never>,
        ) => ElementDescriptor);
  };

export type LayerCardSectionProps = Omit<
  JSX.IntrinsicElements["div"],
  "children"
> & {
  children?: OctaneNode;
  className?: string;
};

function hasLayerCardSections(children: OctaneNode): boolean {
  return Children.toArray(children).some((child): boolean => {
    if (!isValidElement(child)) {
      return false;
    }

    if (
      child.type === LayerCard.Primary ||
      child.type === LayerCard.Secondary
    ) {
      return true;
    }

    if (child.type === Fragment) {
      const fragmentChild = child as ElementDescriptor<{
        children?: OctaneNode;
      }>;
      return hasLayerCardSections(fragmentChild.props.children);
    }

    return false;
  });
}

function LayerCardSecondaryComponent({
  children,
  className,
  ref,
  ...props
}: LayerCardSectionProps) {
  return (
    <div
      ref={ref}
      className={cn(LAYER_CARD_SECONDARY_CLASSES, className)}
      {...props}
    >
      {children}
    </div>
  );
}

function LayerCardPrimaryComponent({
  children,
  className,
  ref,
  ...props
}: LayerCardSectionProps) {
  return (
    <div
      ref={ref}
      className={cn(LAYER_CARD_PRIMARY_CLASSES, className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card container for both simple surfaces and layered layouts.
 *
 * Render children directly for a single-surface card, or use
 * `LayerCard.Secondary` and `LayerCard.Primary` for the layered card treatment.
 *
 * @example
 * ```tsx
 * <LayerCard className="rounded-lg p-4">Card content</LayerCard>
 * ```
 *
 * @example
 * ```tsx
 * <LayerCard>
 *   <LayerCard.Secondary>Getting Started</LayerCard.Secondary>
 *   <LayerCard.Primary>Quick start guide</LayerCard.Primary>
 * </LayerCard>
 * ```
 */
function LayerCardRoot({
  children,
  className,
  render,
  ref,
  ...props
}: LayerCardProps) {
  const hasStructuredLayers = hasLayerCardSections(children);

  const mergedClassName = cn(
    hasStructuredLayers ? LAYER_CARD_LAYERED_ROOT_CLASSES : layerCardVariants(),
    className,
  );

  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: [{ className: mergedClassName }, props, { children }],
  });
}

const LayerCardSecondary = Object.assign(LayerCardSecondaryComponent, {
  displayName: "LayerCard.Secondary",
});

const LayerCardPrimary = Object.assign(LayerCardPrimaryComponent, {
  displayName: "LayerCard.Primary",
});

const LayerCardRootWithDisplayName = Object.assign(LayerCardRoot, {
  displayName: "LayerCard",
});

type LayerCardComponent = typeof LayerCardRootWithDisplayName & {
  Primary: typeof LayerCardPrimary;
  Secondary: typeof LayerCardSecondary;
};

export const LayerCard: LayerCardComponent = Object.assign(
  LayerCardRootWithDisplayName,
  {
    Primary: LayerCardPrimary,
    Secondary: LayerCardSecondary,
  },
);
