/** @jsxImportSource octane */
import { ArrowsClockwise, type Icon } from "@octanejs/phosphor-icons";
import {
  Children,
  createElement,
  isValidElement,
  type ElementDescriptor,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Loader } from "../loader/loader";
import { Tooltip } from "../tooltip/tooltip";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";
import { useLinkComponent } from "../../utils/link-provider";

export const KUMO_BUTTON_VARIANTS = {
  shape: {
    base: {
      classes: "",
      description: "Default rectangular button shape",
    },
    square: {
      classes: "items-center justify-center p-0",
      description: "Square button for icon-only actions",
    },
    circle: {
      classes: "items-center justify-center p-0 rounded-full",
      description: "Circular button for icon-only actions",
    },
  },
  size: {
    xs: {
      classes: "h-5 gap-1 rounded-sm px-1.5 text-xs",
      description: "Extra small button for compact UIs",
    },
    sm: {
      classes: "h-6.5 gap-1 rounded-md px-2 text-xs",
      description: "Small button for secondary actions",
    },
    base: {
      classes: "h-9 gap-1.5 rounded-lg px-3 text-base",
      description: "Default button size",
    },
    lg: {
      classes: "h-10 gap-2 rounded-lg px-4 text-base",
      description: "Large button for primary CTAs",
    },
  },
  compactSize: {
    xs: { classes: "size-3.5" },
    sm: { classes: "size-6.5" },
    base: { classes: "size-9" },
    lg: { classes: "size-10" },
  },
  variant: {
    primary: {
      classes:
        "relative overflow-hidden bg-(--kumo-button-emphasis-bg) !text-white ring ring-(--kumo-button-emphasis-ring) focus:ring-(--kumo-button-emphasis-ring) focus-visible:ring-(--kumo-button-emphasis-ring) active:ring-(--kumo-button-emphasis-ring) disabled:opacity-50",
      description: "High-emphasis button for primary actions",
    },
    secondary: {
      classes:
        "bg-kumo-base !text-kumo-default ring not-disabled:hover:bg-kumo-tint disabled:bg-kumo-base/50 disabled:!text-kumo-default/70 ring-kumo-line data-[state=open]:bg-kumo-base",
      description: "Default button style for most actions",
    },
    ghost: {
      classes: "text-kumo-default hover:bg-kumo-tint shadow-none bg-inherit",
      description: "Minimal button with no background",
    },
    destructive: {
      classes:
        "relative overflow-hidden bg-(--kumo-button-emphasis-bg) !text-white ring ring-(--kumo-button-emphasis-ring) focus:ring-(--kumo-button-emphasis-ring) focus-visible:ring-(--kumo-button-emphasis-ring) active:ring-(--kumo-button-emphasis-ring) disabled:opacity-50",
      description: "Danger button for destructive actions like delete",
    },
    "secondary-destructive": {
      classes:
        "bg-kumo-base !text-kumo-danger ring not-disabled:hover:!text-kumo-danger not-disabled:hover:ring-kumo-danger/30 disabled:bg-kumo-base/50 disabled:!text-kumo-danger/70 ring-kumo-line data-[state=open]:bg-kumo-base",
      description:
        "Secondary button with destructive text for less prominent dangerous actions",
    },
    outline: {
      classes:
        "bg-transparent text-kumo-default ring ring-kumo-line transition-colors not-disabled:hover:text-kumo-strong not-disabled:hover:ring-kumo-focus/25",
      description: "Bordered button with transparent background",
    },
  },
} as const;

export const KUMO_BUTTON_DEFAULT_VARIANTS = {
  shape: "base",
  size: "base",
  variant: "secondary",
} as const;

export type KumoButtonShape = keyof typeof KUMO_BUTTON_VARIANTS.shape;
export type KumoButtonSize = keyof typeof KUMO_BUTTON_VARIANTS.size;
export type KumoButtonVariant = keyof typeof KUMO_BUTTON_VARIANTS.variant;

export interface KumoButtonVariantsProps {
  shape?: KumoButtonShape;
  size?: KumoButtonSize;
  variant?: KumoButtonVariant;
}

export function buttonVariants({
  variant = KUMO_BUTTON_DEFAULT_VARIANTS.variant,
  size = KUMO_BUTTON_DEFAULT_VARIANTS.size,
  shape = KUMO_BUTTON_DEFAULT_VARIANTS.shape,
}: KumoButtonVariantsProps = {}) {
  const isCompactShape = shape === "square" || shape === "circle";

  return cn(
    "group flex w-max shrink-0 items-center font-medium select-none",
    "border-0 shadow-xs",
    "focus:ring-kumo-focus/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand",
    "cursor-pointer",
    "disabled:cursor-not-allowed disabled:text-kumo-subtle",
    resolveVariant(
      KUMO_BUTTON_VARIANTS.size,
      size,
      KUMO_BUTTON_DEFAULT_VARIANTS.size,
    ).classes,
    resolveVariant(
      KUMO_BUTTON_VARIANTS.shape,
      shape,
      KUMO_BUTTON_DEFAULT_VARIANTS.shape,
    ).classes,
    isCompactShape &&
      resolveVariant(
        KUMO_BUTTON_VARIANTS.compactSize,
        size,
        KUMO_BUTTON_DEFAULT_VARIANTS.size,
      ).classes,
    resolveVariant(
      KUMO_BUTTON_VARIANTS.variant,
      variant,
      KUMO_BUTTON_DEFAULT_VARIANTS.variant,
    ).classes,
  );
}

type NativeButtonProps = JSX.IntrinsicElements["button"];
type NativeAnchorProps = JSX.IntrinsicElements["a"];
type NativeStyle = Exclude<NativeButtonProps["style"], string | undefined>;
type KumoStyle = NativeStyle & Record<`--${string}`, string>;
type IconNode = Icon | ElementDescriptor;

function renderIconNode(icon?: IconNode): OctaneNode {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon, {});
}

function getEmphasisToken(variant: KumoButtonVariant) {
  if (variant === "primary") return "var(--color-kumo-brand)";
  if (variant === "destructive") return "var(--color-kumo-danger)";
  return undefined;
}

function getEmphasisStyle(variant: KumoButtonVariant): KumoStyle | undefined {
  const token = getEmphasisToken(variant);
  if (!token) return undefined;

  return {
    "--kumo-button-emphasis-ring": `color-mix(in oklch, ${token}, black 10%)`,
    "--kumo-button-emphasis-bg": `color-mix(in oklch, ${token}, white 30%)`,
    "--kumo-button-emphasis-gradient-start": `color-mix(in oklch, ${token}, white 15%)`,
    "--kumo-button-emphasis-gradient-end": token,
  };
}

const ANCHOR_ONLY_PROPS = new Set([
  "href",
  "target",
  "rel",
  "download",
  "hrefLang",
  "media",
  "ping",
  "referrerPolicy",
  "linksExternal",
]);

function toDisabledButtonProps(props: NativeAnchorProps): NativeButtonProps {
  const result: Record<string, unknown> = { ...props };

  for (const key of Object.keys(result)) {
    if (key.startsWith("on") || ANCHOR_ONLY_PROPS.has(key)) {
      delete result[key];
    }
  }

  return result as NativeButtonProps;
}

function renderButtonContent(
  variant: KumoButtonVariant,
  iconNode: OctaneNode,
  children: OctaneNode,
) {
  const childNode =
    children != null ? <span className="contents">{children}</span> : null;

  if (!getEmphasisToken(variant)) {
    return (
      <>
        {iconNode}
        {childNode}
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] bg-linear-to-b from-(--kumo-button-emphasis-gradient-start) to-(--kumo-button-emphasis-gradient-end) shadow-[inset_0_1px_0_0_var(--kumo-button-emphasis-bg)] group-hover:from-(--kumo-button-emphasis-bg)"
      />
      <span className="relative flex items-center gap-1.5">
        {iconNode}
        {childNode}
      </span>
    </>
  );
}

function getTitleLabel(title: OctaneNode) {
  if (typeof title === "string") return title;
  if (typeof title === "number") return String(title);
  return undefined;
}

type ButtonBaseProps = Omit<
  NativeButtonProps,
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "className"
  | "style"
  | "title"
> & {
  children?: OctaneNode;
  className?: string;
  icon?: IconNode;
  loading?: boolean;
  style?: NativeStyle;
  title?: OctaneNode;
};

type ButtonWithTextProps = ButtonBaseProps & {
  shape?: "base";
  size?: KumoButtonSize;
  variant?: KumoButtonVariant;
};

type IconOnlyButtonAccessibleNameProps =
  | {
      "aria-label": string;
      "aria-labelledby"?: string;
    }
  | {
      "aria-label"?: string;
      "aria-labelledby": string;
    }
  | {
      title: string | number;
      "aria-label"?: string;
      "aria-labelledby"?: string;
    };

type IconOnlyButtonProps = ButtonBaseProps &
  IconOnlyButtonAccessibleNameProps & {
    shape: "square" | "circle";
    size?: KumoButtonSize;
    variant?: KumoButtonVariant;
  };

export type ButtonProps = ButtonWithTextProps | IconOnlyButtonProps;

export type RefreshButtonProps = Omit<
  IconOnlyButtonProps,
  "children" | "icon" | "shape"
>;

export type LinkButtonProps = Omit<
  NativeAnchorProps,
  "children" | "className" | "style" | "title"
> &
  KumoButtonVariantsProps & {
    children?: OctaneNode;
    className?: string;
    disabled?: boolean;
    external?: boolean;
    icon?: IconNode;
    linksExternal?: boolean;
    style?: NativeStyle;
    title?: OctaneNode;
  };

export function Button({
  children,
  className,
  disabled,
  loading,
  shape = "base",
  size = "base",
  variant = "secondary",
  icon,
  style,
  title,
  ref,
  type,
  ...props
}: ButtonProps) {
  const emphasisStyle = getEmphasisStyle(variant);
  const titleLabel = getTitleLabel(title);
  const ariaLabel = "aria-label" in props ? props["aria-label"] : undefined;
  const ariaLabelledBy =
    "aria-labelledby" in props ? props["aria-labelledby"] : undefined;
  const buttonProps = {
    ...props,
    ...(Children.count(children) === 0 &&
      !ariaLabel &&
      !ariaLabelledBy &&
      titleLabel && { "aria-label": titleLabel }),
  };
  const iconNode = loading ? (
    <Loader size={size === "lg" ? 16 : 14} />
  ) : (
    renderIconNode(icon)
  );

  const button = (
    <button
      ref={ref}
      data-kumo-component="Button"
      className={cn(
        buttonVariants({ variant, size, shape }),
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      disabled={loading || disabled}
      style={emphasisStyle ? { ...emphasisStyle, ...style } : style}
      type={type ?? "button"}
      {...buttonProps}
    >
      {renderButtonContent(variant, iconNode, children)}
    </button>
  );

  if (title && (disabled || loading)) {
    return (
      <Tooltip content={title} render={<span className="inline-flex" />}>
        {button}
      </Tooltip>
    );
  }

  if (title) {
    return <Tooltip content={title} render={button} />;
  }

  return button;
}

export function RefreshButton({
  "aria-label": ariaLabel = "Refresh",
  loading,
  ...props
}: RefreshButtonProps) {
  return (
    <Button shape="square" aria-label={ariaLabel} {...props}>
      <ArrowsClockwise
        className={cn({
          "animate-refresh": loading,
          "size-4.5": props.size === "base" || !props.size,
          "size-4": props.size === "sm",
          "size-5": props.size === "lg",
        })}
      />
    </Button>
  );
}

export function LinkButton({
  children,
  className,
  disabled = false,
  external,
  href,
  shape = "base",
  size = "base",
  variant = "ghost",
  icon,
  style,
  title,
  linksExternal: _linksExternal,
  ref,
  ...props
}: LinkButtonProps) {
  const LinkComponent = useLinkComponent();
  const emphasisStyle = getEmphasisStyle(variant);
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  if (disabled) {
    return (
      <Button
        {...toDisabledButtonProps(props)}
        className={cn("select-text", className)}
        data-kumo-component="LinkButton"
        disabled
        icon={icon}
        shape={shape as "base"}
        size={size}
        style={style}
        title={title}
        variant={variant}
      >
        {children}
      </Button>
    );
  }

  const link = (
    <LinkComponent
      ref={ref}
      data-kumo-component="LinkButton"
      className={cn(
        buttonVariants({ variant, size, shape }),
        "flex items-center no-underline! select-text",
        className,
      )}
      href={href}
      style={emphasisStyle ? { ...emphasisStyle, ...style } : style}
      to={typeof href === "string" ? href : undefined}
      {...externalProps}
      {...props}
    >
      {renderButtonContent(variant, renderIconNode(icon), children)}
    </LinkComponent>
  );

  if (title) {
    return <Tooltip content={title} render={link} />;
  }

  return link;
}
