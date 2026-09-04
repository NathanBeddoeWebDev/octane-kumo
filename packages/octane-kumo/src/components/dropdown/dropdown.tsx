/** @jsxImportSource octane */
import {
  Menu as MenuBase,
  type MenuCheckboxItemState,
  type MenuHandle,
  type MenuItemState,
  type MenuPositionerState,
  type MenuRadioItemState,
  type MenuRootChangeEventDetails,
  type MenuSubmenuTriggerState,
  type MenuTriggerState,
} from "@octanejs/base-ui/menu";
import { useIsHydrating } from "@octanejs/base-ui/utils/useIsHydrating";
import { CaretRight, Check, type Icon } from "@octanejs/phosphor-icons";
import {
  createElement,
  isValidElement,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import { useLinkComponent } from "../../utils/link-provider";
import {
  usePortalContainer,
  type PortalContainer,
} from "../../utils/portal-provider";

export const KUMO_DROPDOWN_VARIANTS = {
  variant: {
    default: {
      classes: "",
      description: "Default dropdown item appearance",
    },
    danger: {
      classes:
        "text-kumo-danger data-highlighted:bg-kumo-danger/5 data-highlighted:text-kumo-danger",
      description: "Destructive action item",
    },
  },
} as const;

export const KUMO_DROPDOWN_DEFAULT_VARIANTS = {
  variant: "default",
} as const;

export type KumoDropdownVariant = keyof typeof KUMO_DROPDOWN_VARIANTS.variant;

export interface KumoDropdownVariantsProps {
  variant?: KumoDropdownVariant;
}

export function dropdownVariants({
  variant = KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
}: KumoDropdownVariantsProps = {}) {
  return cn(
    resolveVariant(
      KUMO_DROPDOWN_VARIANTS.variant,
      variant,
      KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

type DivProps = JSX.IntrinsicElements["div"];
type ButtonProps = JSX.IntrinsicElements["button"];
type AnchorProps = JSX.IntrinsicElements["a"];
type SpanProps = JSX.IntrinsicElements["span"];
type IconNode = Icon | ElementDescriptor;
type MenuRender<Props, State> =
  | ElementDescriptor
  | ((props: Props, state: State) => ElementDescriptor);
type ActionsRef<T> = { current: T | null } | ((value: T | null) => void) | null;

export interface DropdownMenuActions {
  close(): void;
  unmount(): void;
}

export interface DropdownMenuRootProps<Payload = unknown> {
  actionsRef?: ActionsRef<DropdownMenuActions>;
  children?: OctaneNode;
  closeParentOnEsc?: boolean;
  defaultOpen?: boolean;
  defaultTriggerId?: string | null;
  disabled?: boolean;
  handle?: MenuHandle<Payload>;
  highlightItemOnHover?: boolean;
  loopFocus?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean, details: MenuRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  open?: boolean;
  orientation?: "horizontal" | "vertical";
  triggerId?: string | null;
}

export type DropdownMenuTriggerProps<Payload = unknown> = Omit<
  ButtonProps,
  "children"
> & {
  children?: OctaneNode;
  closeDelay?: number;
  delay?: number;
  handle?: MenuHandle<Payload>;
  nativeButton?: boolean;
  openOnHover?: boolean;
  payload?: Payload;
  render?: MenuRender<ButtonProps, MenuTriggerState>;
};

interface DropdownMenuPositioningData {
  align: "start" | "center" | "end";
  anchor: { height: number; width: number };
  positioner: { height: number; width: number };
  side: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
}

type DropdownMenuOffset =
  | number
  | ((data: DropdownMenuPositioningData) => number);

export interface DropdownMenuContentProps extends Omit<DivProps, "children"> {
  align?: "start" | "center" | "end";
  alignOffset?: DropdownMenuOffset;
  anchor?:
    | Element
    | { current: Element | null }
    | { getBoundingClientRect(): DOMRect }
    | (() => Element | { getBoundingClientRect(): DOMRect } | null)
    | null;
  arrowPadding?: number;
  children?: OctaneNode;
  collisionAvoidance?: {
    align?: "flip" | "shift" | "none";
    fallbackAxisSide?: "start" | "end" | "none";
    side?: "flip" | "shift" | "none";
  };
  collisionBoundary?:
    | "clipping-ancestors"
    | Element
    | Element[]
    | { height: number; width: number; x: number; y: number };
  collisionPadding?:
    | number
    | Partial<Record<"top" | "right" | "bottom" | "left", number>>;
  container?: PortalContainer;
  disableAnchorTracking?: boolean;
  positionMethod?: "absolute" | "fixed";
  render?: MenuRender<DivProps, MenuPositionerState>;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  sideOffset?: DropdownMenuOffset;
  sticky?: boolean;
}

export type DropdownMenuSubTriggerProps = Omit<DivProps, "children"> & {
  children?: OctaneNode;
  closeDelay?: number;
  delay?: number;
  disabled?: boolean;
  icon?: Icon;
  inset?: boolean;
  label?: string;
  openOnHover?: boolean;
  render?: MenuRender<DivProps, MenuSubmenuTriggerState>;
};

export type DropdownMenuItemProps = Omit<DivProps, "children"> &
  KumoDropdownVariantsProps & {
    children?: OctaneNode;
    closeOnClick?: boolean;
    disabled?: boolean;
    /** @deprecated Use DropdownMenu.LinkItem for navigation. */
    href?: string;
    icon?: IconNode;
    inset?: boolean;
    label?: string;
    nativeButton?: boolean;
    render?: MenuRender<DivProps, MenuItemState>;
    selected?: boolean;
  };

export type DropdownMenuLinkItemProps = Omit<AnchorProps, "children"> &
  KumoDropdownVariantsProps & {
    children?: OctaneNode;
    closeOnClick?: boolean;
    icon?: IconNode;
    inset?: boolean;
    label?: string;
    render?: MenuRender<AnchorProps, { highlighted: boolean }>;
  };

export type DropdownMenuCheckboxItemProps = Omit<DivProps, "children"> & {
  checked?: boolean;
  children?: OctaneNode;
  closeOnClick?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  nativeButton?: boolean;
  onCheckedChange?: (
    checked: boolean,
    details: MenuRootChangeEventDetails,
  ) => void;
  render?: MenuRender<DivProps, MenuCheckboxItemState>;
};

export type DropdownMenuRadioItemProps = Omit<DivProps, "children"> & {
  children?: OctaneNode;
  closeOnClick?: boolean;
  disabled?: boolean;
  icon?: IconNode;
  inset?: boolean;
  label?: string;
  nativeButton?: boolean;
  render?: MenuRender<DivProps, MenuRadioItemState>;
  value: unknown;
};

export type DropdownMenuRadioItemIndicatorProps = Omit<
  SpanProps,
  "children"
> & {
  children?: OctaneNode;
  keepMounted?: boolean;
};

export type DropdownMenuLabelProps = Omit<DivProps, "children"> & {
  children?: OctaneNode;
  inset?: boolean;
  render?: MenuRender<DivProps, Record<never, never>>;
};

export type DropdownMenuShortcutProps = Omit<SpanProps, "children"> & {
  children?: OctaneNode;
};

export type DropdownMenuSeparatorProps = Omit<DivProps, "children"> & {
  orientation?: "horizontal" | "vertical";
  render?: MenuRender<DivProps, { orientation: "horizontal" | "vertical" }>;
};

export interface DropdownMenuRadioGroupProps extends Omit<
  DivProps,
  "children" | "defaultValue"
> {
  children?: OctaneNode;
  defaultValue?: unknown;
  disabled?: boolean;
  onValueChange?: (value: unknown, details: MenuRootChangeEventDetails) => void;
  render?: MenuRender<DivProps, { disabled: boolean }>;
  value?: unknown;
}

function renderIconNode(icon?: IconNode): OctaneNode {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon, { className: "mr-2 h-4 w-4" });
}

function DropdownMenuRoot<Payload = unknown>({
  children,
  ...props
}: DropdownMenuRootProps<Payload>) {
  return <MenuBase.Root {...props}>{children}</MenuBase.Root>;
}

function DropdownMenuTrigger<Payload = unknown>({
  children,
  render,
  ...props
}: DropdownMenuTriggerProps<Payload>) {
  if (render) {
    return (
      <MenuBase.Trigger {...props} render={render}>
        {children}
      </MenuBase.Trigger>
    );
  }

  const childElement = isValidElement(children) ? children : undefined;
  return (
    <MenuBase.Trigger {...props} render={childElement}>
      {childElement ? undefined : children}
    </MenuBase.Trigger>
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 8,
  children,
  container: containerProp,
  ref,
  ...props
}: DropdownMenuContentProps) {
  const isHydrating = useIsHydrating();
  const contextContainer = usePortalContainer();
  const container = containerProp ?? contextContainer ?? undefined;

  return (
    // Stabilize the empty shell only during hydration; normal closed menus still unmount.
    <MenuBase.Portal container={container} keepMounted={isHydrating}>
      <MenuBase.Positioner ref={ref} sideOffset={sideOffset} {...props}>
        <MenuBase.Popup
          className={cn(
            "overflow-hidden bg-kumo-control text-kumo-default",
            "max-h-[var(--available-height)] overflow-y-auto",
            "rounded-lg shadow-lg ring ring-kumo-line",
            "min-w-36 p-1.5",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
        >
          {children}
        </MenuBase.Popup>
      </MenuBase.Positioner>
    </MenuBase.Portal>
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  icon: IconComponent,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuBase.SubmenuTrigger
      data-kumo-component="DropdownMenu"
      data-kumo-part="submenu-trigger"
      className={cn(
        "flex cursor-default items-center rounded-sm text-base outline-hidden select-none",
        "px-2 py-1.5",
        "focus:bg-kumo-tint focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand",
        "data-[state=open]:bg-kumo-tint",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {IconComponent ? <IconComponent className="mr-2 h-4 w-4" /> : null}
      {children}
      <CaretRight className="ml-auto h-4 w-4" />
    </MenuBase.SubmenuTrigger>
  );
}

function DropdownMenuItem({
  className,
  inset,
  icon,
  children,
  selected,
  render,
  href,
  variant = KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
  ...props
}: DropdownMenuItemProps) {
  const LinkComponent = useLinkComponent();
  const innerContent = (
    <>
      {renderIconNode(icon)}
      {children}
      {selected ? (
        <span className="inline-flex">
          <Check />
        </span>
      ) : null}
    </>
  );
  const styles = cn(
    "flex items-center",
    variant === "danger" &&
      "text-kumo-danger data-highlighted:bg-kumo-danger/5 data-highlighted:text-kumo-danger",
  );
  const external = href ? /^(https?:)?\/\//.test(href) : false;
  const linkContent = href ? (
    external ? (
      <a
        className={cn(styles, "w-full text-inherit! no-underline!")}
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {innerContent}
      </a>
    ) : (
      <LinkComponent
        className={cn(styles, "w-full text-inherit! no-underline!")}
        href={href}
        to={href}
        onClick={(event) => event.stopPropagation()}
      >
        {innerContent}
      </LinkComponent>
    )
  ) : undefined;

  return (
    <MenuBase.Item
      data-kumo-component="DropdownMenu"
      data-kumo-part="item"
      className={cn(
        "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-overlay",
        inset && "pl-8",
        dropdownVariants({ variant }),
        className,
      )}
      render={linkContent ?? render}
      {...props}
    >
      {href || render ? undefined : innerContent}
    </MenuBase.Item>
  );
}

function DropdownMenuLinkItem({
  className,
  inset,
  icon,
  children,
  variant = KUMO_DROPDOWN_DEFAULT_VARIANTS.variant,
  ...props
}: DropdownMenuLinkItemProps) {
  return (
    <MenuBase.LinkItem
      data-kumo-component="DropdownMenu"
      data-kumo-part="link-item"
      className={cn(
        "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none",
        "focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-overlay",
        "text-inherit no-underline",
        inset && "pl-8",
        dropdownVariants({ variant }),
        className,
      )}
      {...props}
    >
      {renderIconNode(icon)}
      {children}
    </MenuBase.LinkItem>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <MenuBase.CheckboxItem
      data-kumo-component="DropdownMenu"
      data-kumo-part="checkbox-item"
      className={cn(
        "relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-base outline-hidden transition-colors select-none focus:bg-kumo-tint focus:text-kumo-default focus:ring-kumo-focus/50 focus-visible:ring-2 focus-visible:ring-kumo-brand data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      checked={checked}
      {...props}
    >
      <MenuBase.CheckboxItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-inherit">
        <Check weight="bold" size={12} />
      </MenuBase.CheckboxItemIndicator>
      {children}
    </MenuBase.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  icon,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <MenuBase.RadioItem
      data-kumo-component="DropdownMenu"
      data-kumo-part="radio-item"
      className={cn(
        "relative flex cursor-default items-center rounded-md px-2 py-1.5 text-base outline-hidden select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-kumo-tint",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {renderIconNode(icon)}
      {children}
    </MenuBase.RadioItem>
  );
}

function DropdownMenuRadioItemIndicator({
  className,
  children,
  ...props
}: DropdownMenuRadioItemIndicatorProps) {
  return (
    <MenuBase.RadioItemIndicator
      className={cn("ml-auto", className)}
      {...props}
    >
      {children ?? <Check className="h-4 w-4" />}
    </MenuBase.RadioItemIndicator>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <MenuBase.GroupLabel
      className={cn(
        "px-2 py-1.5 text-base font-semibold",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <MenuBase.Separator
      className={cn("-mx-1 my-1 h-px bg-kumo-hairline", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
}

function DropdownMenuRadioGroup({
  children,
  ...props
}: DropdownMenuRadioGroupProps) {
  return <MenuBase.RadioGroup {...props}>{children}</MenuBase.RadioGroup>;
}

function DropdownMenuGroup({
  children,
  ...props
}: Omit<DivProps, "children"> & {
  children?: OctaneNode;
  render?: MenuRender<DivProps, Record<never, never>>;
}) {
  return <MenuBase.Group {...props}>{children}</MenuBase.Group>;
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: Object.assign(DropdownMenuTrigger, {
    displayName: "DropdownMenu.Trigger",
  }),
  Portal: MenuBase.Portal,
  Sub: MenuBase.SubmenuRoot,
  SubTrigger: Object.assign(DropdownMenuSubTrigger, {
    displayName: "DropdownMenu.SubTrigger",
  }),
  SubContent: Object.assign(DropdownMenuContent, {
    displayName: "DropdownMenu.SubContent",
  }),
  Content: Object.assign(DropdownMenuContent, {
    displayName: "DropdownMenu.Content",
  }),
  Item: Object.assign(DropdownMenuItem, { displayName: "DropdownMenu.Item" }),
  LinkItem: Object.assign(DropdownMenuLinkItem, {
    displayName: "DropdownMenu.LinkItem",
  }),
  CheckboxItem: Object.assign(DropdownMenuCheckboxItem, {
    displayName: "DropdownMenu.CheckboxItem",
  }),
  RadioGroup: Object.assign(DropdownMenuRadioGroup, {
    displayName: "DropdownMenu.RadioGroup",
  }),
  RadioItem: Object.assign(DropdownMenuRadioItem, {
    displayName: "DropdownMenu.RadioItem",
  }),
  RadioItemIndicator: Object.assign(DropdownMenuRadioItemIndicator, {
    displayName: "DropdownMenu.RadioItemIndicator",
  }),
  Label: Object.assign(DropdownMenuLabel, {
    displayName: "DropdownMenu.Label",
  }),
  Separator: Object.assign(DropdownMenuSeparator, {
    displayName: "DropdownMenu.Separator",
  }),
  Shortcut: Object.assign(DropdownMenuShortcut, {
    displayName: "DropdownMenu.Shortcut",
  }),
  Group: Object.assign(DropdownMenuGroup, {
    displayName: "DropdownMenu.Group",
  }),
  displayName: "DropdownMenu",
});
