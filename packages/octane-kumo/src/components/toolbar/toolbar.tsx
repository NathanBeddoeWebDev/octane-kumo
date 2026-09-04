/** @jsxImportSource octane */
import { useRender } from "@octanejs/base-ui/use-render";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  type ComponentBody,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import {
  Button as KumoButton,
  LinkButton as KumoLinkButton,
  type ButtonProps,
  type LinkButtonProps,
} from "../button/button";
import { Input as KumoInput, type InputProps } from "../input/input";
import {
  InputGroup,
  type InputGroupInputProps,
  type InputGroupRootProps,
} from "../input-group/input-group";
import { Loader } from "../loader/loader";
import { cn } from "../../utils/cn";

export const KUMO_TOOLBAR_VARIANTS = {
  size: {
    xs: {
      classes: "text-xs",
      description: "Extra small toolbar for compact UIs",
    },
    sm: {
      classes: "text-xs",
      description: "Small toolbar for secondary controls",
    },
    base: {
      classes: "text-base",
      description: "Default toolbar size",
    },
    lg: {
      classes: "text-base",
      description: "Large toolbar for prominent controls",
    },
  },
} as const;

export const KUMO_TOOLBAR_DEFAULT_VARIANTS = {
  size: "base",
} as const;

export type ToolbarSize = keyof typeof KUMO_TOOLBAR_VARIANTS.size;
export type ToolbarOrientation = "horizontal" | "vertical";

export interface ToolbarRootState {
  disabled: boolean;
  orientation: ToolbarOrientation;
}

type NativeDivProps = Omit<
  JSX.IntrinsicElements["div"],
  "children" | "className"
>;

export interface ToolbarProps extends NativeDivProps {
  children: OctaneNode;
  className?: string;
  disabled?: boolean;
  loopFocus?: boolean;
  orientation?: ToolbarOrientation;
  render?:
    | ElementDescriptor
    | ((
        props: JSX.IntrinsicElements["div"],
        state: ToolbarRootState,
      ) => ElementDescriptor);
  size?: ToolbarSize;
}

export type ToolbarButtonProps = Omit<ButtonProps, "size" | "variant"> & {
  focusableWhenDisabled?: boolean;
};

export type ToolbarLinkProps = Omit<LinkButtonProps, "size" | "variant">;

export type ToolbarInputProps = Omit<
  InputProps,
  | "size"
  | "variant"
  | "label"
  | "labelTooltip"
  | "description"
  | "error"
  | "passwordManagerIgnore"
> & {
  focusableWhenDisabled?: boolean;
};

export type ToolbarInputGroupProps = Omit<InputGroupRootProps, "size">;

interface ToolbarContextValue {
  disabled: boolean;
  orientation: ToolbarOrientation;
  size: ToolbarSize;
}

const ToolbarContext = createContext<ToolbarContextValue>({
  disabled: false,
  orientation: "horizontal",
  size: KUMO_TOOLBAR_DEFAULT_VARIANTS.size,
});

const TOOLBAR_ITEM_SELECTOR = "[data-kumo-toolbar-item]";
const TOOLBAR_CONTROL_STYLES = cn(
  "relative min-w-0 rounded-none border-0 bg-transparent shadow-none ring-0",
  "focus-within:z-2 focus:z-2 focus-visible:z-2 has-[:focus-visible]:z-2",
);

type ElementEvent<T extends HTMLElement, E extends Event> = E & {
  currentTarget: T;
};
type ButtonKeyboardEvent = ElementEvent<HTMLButtonElement, KeyboardEvent>;
type ButtonMouseEvent = ElementEvent<HTMLButtonElement, MouseEvent>;
type DivFocusEvent = ElementEvent<HTMLDivElement, FocusEvent>;
type DivKeyboardEvent = ElementEvent<HTMLDivElement, KeyboardEvent>;
type InputKeyboardEvent = ElementEvent<HTMLInputElement, KeyboardEvent>;
type InputMouseEvent = ElementEvent<HTMLInputElement, MouseEvent>;
type InputPointerEvent = ElementEvent<HTMLInputElement, PointerEvent>;

function isToolbarItemAvailable(element: HTMLElement) {
  if (element.hasAttribute("disabled")) return false;
  return !(
    element.getAttribute("aria-disabled") === "true" &&
    element.getAttribute("data-focusable") === "false"
  );
}

function getToolbarItems(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR),
  ).filter(isToolbarItemAvailable);
}

function setRovingTabStop(root: HTMLElement, preferred?: HTMLElement) {
  const items = getToolbarItems(root);
  if (items.length === 0) return;

  const activeItem = document.activeElement?.closest<HTMLElement>(
    TOOLBAR_ITEM_SELECTOR,
  );
  const selected =
    (preferred && items.includes(preferred) ? preferred : undefined) ??
    (activeItem && items.includes(activeItem) ? activeItem : undefined) ??
    items.find((item) => item.tabIndex === 0) ??
    items[0];

  for (const item of items) {
    item.tabIndex = item === selected ? 0 : -1;
  }
}

function isNativeTextInput(element: HTMLElement): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

function shouldKeepNativeInputNavigation(
  event: KeyboardEvent,
  input: HTMLInputElement,
  forwardKey: string,
  backwardKey: string,
) {
  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  if (
    selectionStart == null ||
    selectionEnd == null ||
    event.shiftKey ||
    selectionStart !== selectionEnd
  ) {
    return true;
  }
  if (event.key === forwardKey && selectionStart < input.value.length) {
    return true;
  }
  return event.key === backwardKey && selectionStart > 0;
}

function Root({
  children,
  className,
  disabled = false,
  loopFocus = true,
  orientation = "horizontal",
  size = KUMO_TOOLBAR_DEFAULT_VARIANTS.size,
  onFocus,
  onKeyDown,
  ref,
  render,
  ...props
}: ToolbarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    setRovingTabStop(root);

    const observer = new MutationObserver(() => setRovingTabStop(root));
    observer.observe(root, {
      attributeFilter: ["aria-disabled", "data-focusable", "disabled"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [children]);

  function handleFocus(event: DivFocusEvent) {
    onFocus?.(event);
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>(TOOLBAR_ITEM_SELECTOR);
    if (item && rootRef.current?.contains(item)) {
      setRovingTabStop(rootRef.current, item);
    }
  }

  function handleKeyDown(event: DivKeyboardEvent) {
    onKeyDown?.(event);
    const root = rootRef.current;
    if (!root) return;

    const rtl = getComputedStyle(root).direction === "rtl";
    const forwardKey =
      orientation === "horizontal"
        ? rtl
          ? "ArrowLeft"
          : "ArrowRight"
        : "ArrowDown";
    const backwardKey =
      orientation === "horizontal"
        ? rtl
          ? "ArrowRight"
          : "ArrowLeft"
        : "ArrowUp";
    if (event.key !== forwardKey && event.key !== backwardKey) return;

    const target = event.target as HTMLElement;
    if (
      isNativeTextInput(target) &&
      target.getAttribute("aria-disabled") !== "true" &&
      shouldKeepNativeInputNavigation(event, target, forwardKey, backwardKey)
    ) {
      return;
    }

    const items = getToolbarItems(root);
    const current = document.activeElement?.closest<HTMLElement>(
      TOOLBAR_ITEM_SELECTOR,
    );
    const currentIndex = current ? items.indexOf(current) : -1;
    if (currentIndex === -1) return;

    const offset = event.key === forwardKey ? 1 : -1;
    let nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= items.length) {
      if (!loopFocus) return;
      nextIndex = (nextIndex + items.length) % items.length;
    }

    const next = items[nextIndex];
    if (!next || next === current) return;
    event.preventDefault();
    event.stopPropagation();
    setRovingTabStop(root, next);
    queueMicrotask(() => next.focus());
  }

  const state: ToolbarRootState = { disabled, orientation };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref, rootRef],
    state,
    props: [
      props,
      {
        "aria-orientation": orientation,
        className: cn(
          "inline-flex w-fit items-stretch rounded-lg bg-kumo-control shadow-xs ring ring-kumo-line",
          "[&>*:first-child]:rounded-l-lg [&>*:not([aria-hidden='true']):not([type='hidden']):not(:has(~_:not([aria-hidden='true']):not([type='hidden'])))]:rounded-r-lg",
          "[&>*_[data-kumo-toolbar-input]:focus]:rounded-[inherit]",
          "[&>*:not([aria-hidden='true']):not(:first-child)]:border-l [&>*:not([aria-hidden='true']):not(:first-child)]:border-kumo-line",
          KUMO_TOOLBAR_VARIANTS.size[size].classes,
          className,
        ),
        "data-disabled": disabled ? "" : undefined,
        "data-kumo-component": "Toolbar",
        "data-orientation": orientation,
        onFocus: handleFocus,
        onKeyDown: handleKeyDown,
        role: "toolbar",
        children: (
          <ToolbarContext.Provider value={{ disabled, orientation, size }}>
            {children}
          </ToolbarContext.Provider>
        ),
      },
    ],
  });
}

Root.displayName = "Toolbar";

function ToolbarButton({
  children,
  className,
  disabled = false,
  focusableWhenDisabled = true,
  loading = false,
  shape,
  icon,
  onClick,
  onKeyDown,
  type,
  ...props
}: ToolbarButtonProps) {
  const toolbar = useContext(ToolbarContext);
  const resolvedShape = shape ?? (children == null && icon ? "square" : "base");
  const effectiveDisabled = toolbar.disabled || disabled || loading;
  const ariaLabel = props["aria-label"];
  const displayedIcon = loading ? (
    <Loader size={toolbar.size === "lg" ? 16 : 14} />
  ) : (
    icon
  );

  const commonProps = {
    ...props,
    "aria-disabled": effectiveDisabled ? true : undefined,
    "data-disabled": effectiveDisabled ? "" : undefined,
    "data-focusable": String(focusableWhenDisabled),
    "data-kumo-component": "Toolbar.Button",
    "data-kumo-toolbar-item": "",
    "data-orientation": toolbar.orientation,
    className: cn(
      TOOLBAR_CONTROL_STYLES,
      effectiveDisabled && "cursor-not-allowed opacity-50",
      className,
    ),
    disabled: effectiveDisabled && !focusableWhenDisabled,
    icon: displayedIcon,
    onClick(event: ButtonMouseEvent) {
      if (effectiveDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onKeyDown(event: ButtonKeyboardEvent) {
      onKeyDown?.(event);
      if (effectiveDisabled && event.key !== "Tab") {
        event.preventDefault();
      }
    },
    size: toolbar.size,
    tabIndex: -1,
    type: type ?? "button",
    variant: "ghost" as const,
  };

  return resolvedShape === "base" ? (
    <KumoButton shape="base" {...commonProps}>
      {children}
    </KumoButton>
  ) : (
    <KumoButton
      aria-label={ariaLabel ?? ""}
      shape={resolvedShape}
      {...commonProps}
    >
      {children}
    </KumoButton>
  );
}

ToolbarButton.displayName = "Toolbar.Button";

function ToolbarLink({
  children,
  className,
  shape,
  icon,
  ...props
}: ToolbarLinkProps) {
  const toolbar = useContext(ToolbarContext);
  const resolvedShape = shape ?? (children == null && icon ? "square" : "base");

  return (
    <KumoLinkButton
      {...props}
      className={cn(TOOLBAR_CONTROL_STYLES, className)}
      data-focusable="true"
      data-kumo-component="Toolbar.Link"
      data-kumo-toolbar-item=""
      data-orientation={toolbar.orientation}
      icon={icon}
      shape={resolvedShape}
      size={toolbar.size}
      tabIndex={-1}
      variant="ghost"
    >
      {children}
    </KumoLinkButton>
  );
}

ToolbarLink.displayName = "Toolbar.Link";

function ToolbarInput({
  className,
  disabled = false,
  focusableWhenDisabled = true,
  onClick,
  onKeyDown,
  onPointerDown,
  ...props
}: ToolbarInputProps) {
  const toolbar = useContext(ToolbarContext);
  const effectiveDisabled = toolbar.disabled || disabled;

  return (
    <KumoInput
      {...props}
      aria-disabled={effectiveDisabled ? true : undefined}
      className={cn(TOOLBAR_CONTROL_STYLES, className)}
      data-focusable={String(focusableWhenDisabled)}
      data-kumo-component="Toolbar.Input"
      data-kumo-toolbar-input=""
      data-kumo-toolbar-item=""
      data-orientation={toolbar.orientation}
      disabled={effectiveDisabled && !focusableWhenDisabled}
      onClick={(event: InputMouseEvent) => {
        if (effectiveDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      onKeyDown={(event: InputKeyboardEvent) => {
        onKeyDown?.(event);
        if (effectiveDisabled && event.key !== "Tab") {
          event.preventDefault();
        }
      }}
      onPointerDown={(event: InputPointerEvent) => {
        if (effectiveDisabled) {
          event.preventDefault();
          return;
        }
        onPointerDown?.(event);
      }}
      size={toolbar.size}
      tabIndex={-1}
    />
  );
}

ToolbarInput.displayName = "Toolbar.Input";

function componentDisplayName(element: ElementDescriptor) {
  const type = element.type;
  if (typeof type !== "function" && typeof type !== "object") return undefined;
  return (type as ComponentBody & { displayName?: string }).displayName;
}

function ToolbarInputGroup({
  children,
  className,
  disabled = false,
  ...props
}: ToolbarInputGroupProps) {
  const toolbar = useContext(ToolbarContext);
  const ariaLabel = props["aria-label"];
  const ariaLabelledBy = props["aria-labelledby"];
  const inputDisabled = toolbar.disabled || disabled;
  const toolbarChildren = Children.map(children, (child) => {
    if (
      !isValidElement(child) ||
      componentDisplayName(child) !== "InputGroup.Input"
    ) {
      return child;
    }

    const childProps = child.props as InputGroupInputProps;
    return cloneElement(child, {
      "aria-disabled": inputDisabled ? true : undefined,
      "aria-label": childProps["aria-label"] ?? ariaLabel,
      "aria-labelledby": childProps["aria-labelledby"] ?? ariaLabelledBy,
      "data-focusable": "true",
      "data-kumo-toolbar-input": "",
      "data-kumo-toolbar-item": "",
      "data-orientation": toolbar.orientation,
      onClick(event: InputMouseEvent) {
        if (inputDisabled) {
          event.preventDefault();
          return;
        }
        childProps.onClick?.(event);
      },
      onKeyDown(event: InputKeyboardEvent) {
        childProps.onKeyDown?.(event);
        if (inputDisabled && event.key !== "Tab") {
          event.preventDefault();
        }
      },
      onPointerDown(event: InputPointerEvent) {
        if (inputDisabled) {
          event.preventDefault();
          return;
        }
        childProps.onPointerDown?.(event);
      },
      tabIndex: -1,
    });
  });

  return (
    <InputGroup
      {...props}
      className={cn(TOOLBAR_CONTROL_STYLES, className)}
      disabled={disabled}
      size={toolbar.size}
    >
      {toolbarChildren}
    </InputGroup>
  );
}

ToolbarInputGroup.displayName = "Toolbar.InputGroup";

export const Toolbar = Object.assign(Root, {
  Button: ToolbarButton,
  Input: ToolbarInput,
  InputGroup: ToolbarInputGroup,
  Link: ToolbarLink,
  displayName: "Toolbar",
});
