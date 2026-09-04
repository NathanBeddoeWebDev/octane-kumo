/** @jsxImportSource octane */
import { Input as BaseInput } from "@octanejs/base-ui/input";
import type { OctaneNode } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Field, normalizeFieldError, type FieldError } from "../field/field";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

export const KUMO_INPUT_VARIANTS = {
  size: {
    xs: {
      classes: "h-5 gap-1 rounded-sm px-1.5 text-xs",
      description: "Extra small input for compact UIs",
    },
    sm: {
      classes: "h-6.5 gap-1 rounded-md px-2 text-xs",
      description: "Small input for secondary fields",
    },
    base: {
      classes: "h-9 gap-1.5 rounded-lg px-3 text-base",
      description: "Default input size",
    },
    lg: {
      classes: "h-10 gap-2 rounded-lg px-4 text-base",
      description: "Large input for prominent fields",
    },
  },
  variant: {
    default: {
      classes: "focus:ring-kumo-focus/50 focus:ring-[1.5px]",
      description: "Default input appearance",
    },
    error: {
      classes: "!ring-kumo-danger focus:ring-kumo-danger/50 focus:ring-[1.5px]",
      description: "Error state for validation failures",
    },
  },
} as const;

export const KUMO_INPUT_DEFAULT_VARIANTS = {
  size: "base",
  variant: "default",
} as const;

export const KUMO_INPUT_STYLING = {
  dimensions: {
    xs: { height: 20, paddingX: 6, fontSize: 12, borderRadius: 2, width: 160 },
    sm: { height: 26, paddingX: 8, fontSize: 12, borderRadius: 6, width: 200 },
    base: {
      height: 36,
      paddingX: 12,
      fontSize: 16,
      borderRadius: 8,
      width: 280,
    },
    lg: { height: 40, paddingX: 16, fontSize: 16, borderRadius: 8, width: 320 },
  },
  baseTokens: {
    background: "color-secondary",
    text: "text-color-surface",
    placeholder: "text-color-muted",
    ring: "color-border",
  },
  stateTokens: {
    focus: { ring: "color-active" },
    error: { ring: "color-error" },
    disabled: { opacity: 0.5, text: "text-color-muted" },
  },
} as const;

export type KumoInputSize = keyof typeof KUMO_INPUT_VARIANTS.size;
export type KumoInputVariant = keyof typeof KUMO_INPUT_VARIANTS.variant;

export interface KumoInputVariantsProps {
  focusIndicator?: boolean;
  parentFocusIndicator?: boolean;
  size?: KumoInputSize;
  variant?: KumoInputVariant;
}

export interface InputValueChangeDetails {
  allowPropagation(): void;
  cancel(): void;
  event: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  reason: "none";
  trigger: Element | undefined;
}

export function inputVariants({
  focusIndicator = false,
  parentFocusIndicator = false,
  size = KUMO_INPUT_DEFAULT_VARIANTS.size,
  variant = KUMO_INPUT_DEFAULT_VARIANTS.variant,
}: KumoInputVariantsProps = {}) {
  return cn(
    "border-0 bg-kumo-control text-kumo-default ring ring-kumo-line outline-none focus:outline-none",
    "kumo-input-placeholder disabled:text-kumo-disabled",
    resolveVariant(
      KUMO_INPUT_VARIANTS.size,
      size,
      KUMO_INPUT_DEFAULT_VARIANTS.size,
    ).classes,
    resolveVariant(
      KUMO_INPUT_VARIANTS.variant,
      variant,
      KUMO_INPUT_DEFAULT_VARIANTS.variant,
    ).classes,
    parentFocusIndicator &&
      (variant === "error"
        ? "focus-within:ring-[1.5px] focus-within:ring-kumo-danger/50"
        : "focus-within:ring-[1.5px] focus-within:ring-kumo-focus/50"),
    focusIndicator &&
      (variant === "error"
        ? "focus:ring-[1.5px] focus:ring-kumo-danger/50"
        : "focus:ring-[1.5px] focus:ring-kumo-focus/50"),
  );
}

type NativeInputProps = Omit<JSX.IntrinsicElements["input"], "size">;

export type InputProps = NativeInputProps &
  Pick<KumoInputVariantsProps, "size" | "variant"> & {
    description?: OctaneNode;
    error?: string | FieldError;
    label?: OctaneNode;
    labelTooltip?: OctaneNode;
    onValueChange?: (value: string, details: InputValueChangeDetails) => void;
    passwordManagerIgnore?: boolean;
  };

export function Input({
  className,
  description,
  error,
  label,
  labelTooltip,
  passwordManagerIgnore = false,
  size = KUMO_INPUT_DEFAULT_VARIANTS.size,
  variant: variantProp,
  ...inputProps
}: InputProps) {
  if (process.env.NODE_ENV !== "production" && variantProp === "error") {
    console.warn(
      '[Kumo Input]: variant="error" is deprecated. ' +
        "Error styling is now automatically applied when the `error` prop is truthy. " +
        "Simply remove the variant prop and pass an error message instead.",
    );
  }

  const variant = variantProp ?? (error ? "error" : "default");
  const hasAccessibleName =
    Boolean(label) ||
    Boolean(inputProps["aria-label"]) ||
    Boolean(inputProps["aria-labelledby"]);

  if (process.env.NODE_ENV !== "production" && !hasAccessibleName) {
    console.warn(
      "[Kumo Input]: Input must have an accessible name. Provide either:\n" +
        "  - label prop: <Input label='Email' />\n" +
        "  - aria-label: <Input aria-label='Email address' />\n" +
        "  - aria-labelledby for custom label association",
    );
  }

  const input = (
    <BaseInput
      {...inputProps}
      {...(passwordManagerIgnore
        ? {
            "data-1p-ignore": "true",
            "data-bwignore": "true",
            "data-form-type": "other",
            "data-lpignore": "true",
          }
        : {})}
      className={cn(
        inputVariants({ focusIndicator: true, size, variant }),
        passwordManagerIgnore && "keeper-ignore",
        className,
      )}
    />
  );

  if (label || error || description) {
    return (
      <Field
        description={description}
        error={normalizeFieldError(error)}
        label={label}
        labelTooltip={labelTooltip}
        required={inputProps.required}
      >
        {input}
      </Field>
    );
  }

  return input;
}
