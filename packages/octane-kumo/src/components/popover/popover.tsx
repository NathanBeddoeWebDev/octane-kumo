/** @jsxImportSource octane */
import {
  Popover as PopoverBase,
  type PopoverHandle,
} from "@octanejs/base-ui/popover";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { type ElementDescriptor, type OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";

export const KUMO_POPOVER_VARIANTS = {
  side: {
    top: { classes: "", description: "Popover appears above the trigger" },
    bottom: { classes: "", description: "Popover appears below the trigger" },
    left: {
      classes: "",
      description: "Popover appears to the left of the trigger",
    },
    right: {
      classes: "",
      description: "Popover appears to the right of the trigger",
    },
  },
} as const;

export const KUMO_POPOVER_DEFAULT_VARIANTS = {
  side: "bottom",
} as const;

export type KumoPopoverSide = keyof typeof KUMO_POPOVER_VARIANTS.side;
export type PopoverAlign = "start" | "center" | "end";
export type PopoverPositionMethod = "absolute" | "fixed";
export type PopoverAnchor =
  | Element
  | { current: Element | null }
  | { getBoundingClientRect(): DOMRect }
  | (() => Element | { getBoundingClientRect(): DOMRect } | null)
  | null;

export interface KumoPopoverVariantsProps {
  side?: KumoPopoverSide;
}

export type PopoverOpenChangeReason =
  | "trigger-hover"
  | "trigger-focus"
  | "trigger-press"
  | "outside-press"
  | "escape-key"
  | "close-press"
  | "focus-out"
  | "imperative-action"
  | "none";

export interface PopoverOpenChangeDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  preventUnmountOnClose(): void;
  reason: PopoverOpenChangeReason;
  trigger: Element | undefined;
}

export interface PopoverActions {
  close(): void;
  unmount(): void;
}

type ActionsRef<T> = { current: T | null } | ((value: T | null) => void) | null;
type ButtonProps = JSX.IntrinsicElements["button"];
type HeadingProps = JSX.IntrinsicElements["h2"];
type ParagraphProps = JSX.IntrinsicElements["p"];

export interface PopoverRootProps {
  actionsRef?: ActionsRef<PopoverActions>;
  children?: OctaneNode;
  defaultOpen?: boolean;
  defaultTriggerId?: string | null;
  handle?: PopoverHandle<unknown>;
  modal?: boolean | "trap-focus";
  onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  open?: boolean;
  triggerId?: string | null;
}

export interface PopoverTriggerState {
  disabled: boolean;
  open: boolean;
}

export type PopoverTriggerProps = Omit<ButtonProps, "children"> & {
  asChild?: boolean;
  children?: OctaneNode;
  closeDelay?: number;
  delay?: number;
  handle?: PopoverHandle<unknown>;
  nativeButton?: boolean;
  openOnHover?: boolean;
  payload?: unknown;
  render?:
    | ElementDescriptor
    | ((props: ButtonProps, state: PopoverTriggerState) => ElementDescriptor);
};

export interface PopoverContentProps extends KumoPopoverVariantsProps {
  align?: PopoverAlign;
  alignOffset?: number;
  anchor?: PopoverAnchor;
  children?: OctaneNode;
  className?: string;
  container?: PortalContainer;
  positionMethod?: PopoverPositionMethod;
  sideOffset?: number;
}

export type PopoverTitleProps = Omit<HeadingProps, "children"> & {
  children?: OctaneNode;
  render?: ElementDescriptor | ((props: HeadingProps) => ElementDescriptor);
};

export type PopoverDescriptionProps = Omit<ParagraphProps, "children"> & {
  children?: OctaneNode;
  render?: ElementDescriptor | ((props: ParagraphProps) => ElementDescriptor);
};

export type PopoverCloseProps = Omit<ButtonProps, "children"> & {
  asChild?: boolean;
  children?: OctaneNode;
  nativeButton?: boolean;
  render?: ElementDescriptor | ((props: ButtonProps) => ElementDescriptor);
};

function PopoverRoot({ children, ...props }: PopoverRootProps) {
  return <PopoverBase.Root {...props}>{children}</PopoverBase.Root>;
}

function PopoverTrigger({
  children,
  className,
  asChild,
  render,
  ...props
}: PopoverTriggerProps) {
  const resolvedRender =
    render ?? (asChild ? (children as ElementDescriptor) : undefined);

  return (
    <PopoverBase.Trigger
      data-kumo-component="Popover"
      data-kumo-part="trigger"
      className={className}
      render={resolvedRender}
      {...props}
    >
      {asChild ? undefined : children}
    </PopoverBase.Trigger>
  );
}

function PopoverContent({
  children,
  side = KUMO_POPOVER_DEFAULT_VARIANTS.side,
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  positionMethod = "absolute",
  anchor,
  className,
  container: containerProp,
}: PopoverContentProps) {
  const isHydrating = useIsHydrating();
  const contextContainer = usePortalContainer();
  const container = containerProp ?? contextContainer ?? undefined;

  return (
    // Stabilize the empty shell only during hydration; normal closed popovers still unmount.
    <PopoverBase.Portal container={container} keepMounted={isHydrating}>
      <PopoverBase.Positioner
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        positionMethod={positionMethod}
      >
        <PopoverBase.Popup
          className={cn(
            "flex origin-(--transform-origin) flex-col rounded-lg bg-kumo-base px-4 py-3 text-sm text-kumo-default",
            "shadow-md outline outline-kumo-line",
            "transition-[transform,scale,opacity] duration-150",
            "data-starting-style:scale-90 data-starting-style:opacity-0",
            "data-ending-style:scale-90 data-ending-style:opacity-0",
            "data-instant:duration-0",
            "kumo-popover-popup",
            className,
          )}
        >
          <PopoverBase.Arrow
            className={cn(
              "flex",
              "data-[side=bottom]:-top-2",
              "data-[side=left]:right-[-13px] data-[side=left]:rotate-90",
              "data-[side=right]:left-[-13px] data-[side=right]:-rotate-90",
              "data-[side=top]:-bottom-2 data-[side=top]:rotate-180",
            )}
          >
            <ArrowSvg />
          </PopoverBase.Arrow>
          {children}
        </PopoverBase.Popup>
      </PopoverBase.Positioner>
    </PopoverBase.Portal>
  );
}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <PopoverBase.Title
      className={cn("m-0 text-base leading-6 font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <PopoverBase.Description
      className={cn("m-0 text-base leading-6 text-kumo-subtle", className)}
      {...props}
    />
  );
}

function PopoverClose({
  children,
  className,
  asChild,
  render,
  ...props
}: PopoverCloseProps) {
  const resolvedRender =
    render ?? (asChild ? (children as ElementDescriptor) : undefined);

  return (
    <PopoverBase.Close className={className} render={resolvedRender} {...props}>
      {asChild ? undefined : children}
    </PopoverBase.Close>
  );
}

function ArrowSvg(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-kumo-base"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-kumo-arrow-edge"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="fill-kumo-arrow-stroke"
      />
    </svg>
  );
}

export const Popover = Object.assign(PopoverRoot, {
  Trigger: Object.assign(PopoverTrigger, { displayName: "Popover.Trigger" }),
  Content: Object.assign(PopoverContent, { displayName: "Popover.Content" }),
  Title: Object.assign(PopoverTitle, { displayName: "Popover.Title" }),
  Description: Object.assign(PopoverDescription, {
    displayName: "Popover.Description",
  }),
  Close: Object.assign(PopoverClose, { displayName: "Popover.Close" }),
  displayName: "Popover",
});

export {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
};
