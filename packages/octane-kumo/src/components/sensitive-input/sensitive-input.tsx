/** @jsxImportSource octane */
import { Eye, EyeSlash } from "@octanejs/phosphor-icons";
import { Input as BaseInput } from "@octanejs/base-ui/input";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import {
  inputVariants,
  KUMO_INPUT_VARIANTS,
  type KumoInputSize,
  type KumoInputVariant,
} from "../input/input";
import { Field, normalizeFieldError, type FieldError } from "../field/field";
import { cn } from "../../utils/cn";

export const KUMO_SENSITIVE_INPUT_VARIANTS = KUMO_INPUT_VARIANTS;

export const KUMO_SENSITIVE_INPUT_DEFAULT_VARIANTS = {
  size: "base",
  variant: "default",
} as const;

type NativeInputProps = JSX.IntrinsicElements["input"];
type InputRef = NonNullable<NativeInputProps["ref"]>;
type NativeInputEvent = InputEvent & { currentTarget: HTMLInputElement };
type NativeFocusEvent = FocusEvent & { currentTarget: HTMLInputElement };
type NativeKeyboardEvent<Element extends HTMLElement> = KeyboardEvent & {
  currentTarget: Element;
};
type Mode = "empty" | "masked" | "revealed";

interface SensitiveInputSizeTokens {
  inputEndPadding: string;
  maskBounds: string;
  toggleInset: string;
}

const SENSITIVE_INPUT_SIZE: Record<KumoInputSize, SensitiveInputSizeTokens> = {
  xs: {
    inputEndPadding: "pr-5",
    maskBounds: "right-5 px-1.5",
    toggleInset: "right-1.5",
  },
  sm: {
    inputEndPadding: "pr-6",
    maskBounds: "right-6 px-2",
    toggleInset: "right-2",
  },
  base: {
    inputEndPadding: "pr-8",
    maskBounds: "right-8 px-3",
    toggleInset: "right-3",
  },
  lg: {
    inputEndPadding: "pr-10",
    maskBounds: "right-10 px-4",
    toggleInset: "right-4",
  },
};

function isInputRefArray(
  ref: InputRef,
): ref is Extract<InputRef, readonly unknown[]> {
  return Array.isArray(ref);
}

function assignInputRef(
  ref: InputRef | null | undefined,
  node: HTMLInputElement,
): (() => void) | undefined {
  if (!ref) return undefined;
  if (isInputRefArray(ref)) {
    const cleanups = ref.flatMap((item) => {
      const cleanup = assignInputRef(item, node);
      return cleanup ? [cleanup] : [];
    });
    return () => {
      for (const cleanup of cleanups.reverse()) cleanup();
    };
  }
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }
  ref.current = node;
  return () => {
    ref.current = null;
  };
}

export type SensitiveInputProps = Omit<
  NativeInputProps,
  "defaultValue" | "onCopy" | "size" | "type" | "value"
> & {
  defaultValue?: string;
  description?: OctaneNode;
  error?: string | FieldError;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  onCopy?: () => void;
  onValueChange?: (value: string) => void;
  size?: KumoInputSize;
  value?: string;
  variant?: KumoInputVariant;
};

function fallbackCopy(value: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  const selection = document.getSelection();
  const previousRange = selection?.rangeCount
    ? selection.getRangeAt(0)
    : undefined;
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch (error) {
    console.warn("Clipboard copy failed", error);
    return false;
  } finally {
    textarea.remove();
    if (previousRange) {
      selection?.removeAllRanges();
      selection?.addRange(previousRange);
    }
  }
}

export function SensitiveInput({
  "aria-label": ariaLabel,
  autoComplete = "off",
  className,
  defaultValue = "",
  description,
  disabled = false,
  error,
  id,
  label,
  labelTooltip,
  onBlur,
  onChange,
  onCopy,
  onInput,
  onKeyDown,
  onValueChange,
  readOnly = false,
  ref,
  required,
  size = KUMO_SENSITIVE_INPUT_DEFAULT_VARIANTS.size,
  value: controlledValue,
  variant: variantProp,
  ...inputProps
}: SensitiveInputProps) {
  if (process.env.NODE_ENV !== "production" && variantProp === "error") {
    console.warn(
      '[Kumo SensitiveInput]: variant="error" is deprecated. ' +
        "Error styling is now automatically applied when the `error` prop is truthy. " +
        "Simply remove the variant prop and pass an error message instead.",
    );
  }

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;
  const hasValue = value.length > 0;
  const [mode, setMode] = useState<Mode>(hasValue ? "masked" : "empty");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const instructionId = useId();
  const liveRegionId = useId();
  const variant = variantProp ?? (error ? "error" : "default");
  const maskedLabel =
    typeof ariaLabel === "string"
      ? ariaLabel
      : typeof label === "string"
        ? label
        : "Sensitive value";
  const mergedRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (!node) return;
      const cleanup = assignInputRef(ref, node);
      return () => {
        inputRef.current = null;
        cleanup?.();
      };
    },
    [ref],
  );

  useEffect(() => {
    if (!hasValue && mode === "masked") setMode("empty");
  }, [hasValue, mode]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const reveal = useCallback(() => {
    if (disabled || mode !== "masked" || !hasValue) return;
    setMode("revealed");
    if (!readOnly) setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, hasValue, mode, readOnly]);

  const handleContainerClick = useCallback(
    (event: MouseEvent & { currentTarget: HTMLDivElement }) => {
      if (disabled) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (
        rect &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      ) {
        return;
      }
      reveal();
    },
    [disabled, reveal],
  );

  const handleContainerKeyDown = useCallback(
    (event: NativeKeyboardEvent<HTMLDivElement>) => {
      if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      reveal();
    },
    [disabled, reveal],
  );

  const handleInput = useCallback(
    (event: NativeInputEvent) => {
      const nextValue = event.currentTarget.value;
      if (!isControlled) setInternalValue(nextValue);
      if (mode === "empty" && nextValue.length > 0) setMode("revealed");
      onInput?.(event);
      onValueChange?.(nextValue);
    },
    [isControlled, mode, onInput, onValueChange],
  );

  const handleBlur = useCallback(
    (event: NativeFocusEvent) => {
      onBlur?.(event);
      if (
        containerRef.current &&
        event.relatedTarget instanceof Node &&
        containerRef.current.contains(event.relatedTarget)
      ) {
        return;
      }
      if (hasValue) setMode("masked");
    },
    [hasValue, onBlur],
  );

  const handleInputKeyDown = useCallback(
    (event: NativeKeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (mode !== "revealed" || event.key !== "Escape") return;
      setMode("masked");
      setTimeout(() => containerRef.current?.focus(), 0);
    },
    [mode, onKeyDown],
  );

  const handleToggleVisibility = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      if (mode === "revealed") setMode("masked");
      else if (mode === "empty" && hasValue) setMode("revealed");
    },
    [hasValue, mode],
  );

  const copyToClipboard = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation();
      let copiedValue = false;

      try {
        if (typeof navigator.clipboard?.writeText === "function") {
          await navigator.clipboard.writeText(value);
          copiedValue = true;
        }
      } catch {
        copiedValue = false;
      }

      if (!copiedValue) copiedValue = fallbackCopy(value);
      if (copiedValue) {
        setCopied(true);
        onCopy?.();
      }
    },
    [onCopy, value],
  );

  const isMasked = mode === "masked" && hasValue;
  const showEyeButton =
    !disabled && (mode === "revealed" || (mode === "empty" && hasValue));
  const iconSize = size === "xs" || size === "sm" ? "size-3" : "size-4";
  const sizeTokens = SENSITIVE_INPUT_SIZE[size];
  const containerClassName = cn(
    inputVariants({ parentFocusIndicator: true, size, variant }),
    "group/container relative flex w-full items-center",
    "focus-within:outline-2 focus-within:outline-kumo-focus",
    isMasked && !disabled && "cursor-pointer",
    disabled && "cursor-not-allowed",
    className,
  );

  const content = (
    <>
      <BaseInput
        {...inputProps}
        aria-hidden={isMasked ? true : inputProps["aria-hidden"]}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        className={cn(
          "kumo-input-placeholder w-full border-0 bg-transparent p-0 text-kumo-default ring-0 outline-none disabled:cursor-not-allowed disabled:text-kumo-subtle",
          sizeTokens.inputEndPadding,
          isMasked && "pointer-events-none text-transparent",
        )}
        disabled={disabled}
        id={inputId}
        onBlur={handleBlur}
        onChange={onChange}
        onInput={handleInput}
        onKeyDown={handleInputKeyDown}
        readOnly={readOnly || isMasked}
        ref={mergedRef}
        tabIndex={isMasked ? -1 : 0}
        type={mode === "revealed" ? "text" : "password"}
        value={value}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden select-none",
          sizeTokens.maskBounds,
          !isMasked && "invisible",
          isMasked && "pointer-events-auto",
          "group/mask text-kumo-default",
        )}
      >
        <span className={cn("relative")}>
          <span
            className={cn(
              isMasked &&
                !disabled &&
                "group-focus-within/container:invisible group-hover/mask:invisible",
            )}
          >
            ••••••••
          </span>
          {isMasked && !disabled ? (
            <span
              className={cn(
                "invisible absolute top-0 left-0 whitespace-nowrap text-kumo-subtle",
                "group-focus-within/container:visible group-hover/mask:visible",
              )}
            >
              Click to reveal
            </span>
          ) : null}
        </span>
      </span>
      <button
        aria-label={mode === "revealed" ? "Hide value" : "Reveal value"}
        className={cn(
          "absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer text-kumo-subtle",
          "hover:text-kumo-default focus:text-kumo-default focus:ring-kumo-focus/50",
          "focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-kumo-brand",
          "m-0 inline-flex h-auto min-h-0 items-center justify-center border-none bg-transparent p-0 shadow-none",
          sizeTokens.toggleInset,
          iconSize,
          !showEyeButton && "pointer-events-none opacity-0",
        )}
        data-kumo-component="SensitiveInput"
        data-kumo-part="toggle-visibility"
        onClick={handleToggleVisibility}
        onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
        tabIndex={showEyeButton ? 0 : -1}
        type="button"
      >
        {mode === "revealed" ? (
          <EyeSlash className={cn("size-full")} />
        ) : (
          <Eye className={cn("size-full")} />
        )}
      </button>
      {hasValue && !disabled ? (
        <button
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          className={cn(
            "absolute -top-px right-2 -translate-y-full cursor-pointer rounded-t-md bg-kumo-brand px-2 py-0.5 text-xs text-white opacity-0 transition-opacity",
            "group-focus-within/container:opacity-100 group-hover/container:opacity-100",
            "hover:brightness-120 focus:ring-kumo-focus/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand",
            "m-0 h-auto min-h-0 border-none shadow-none",
          )}
          data-kumo-component="SensitiveInput"
          data-kumo-part="copy"
          onClick={copyToClipboard}
          onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </>
  );
  const control = (
    <div>
      {isMasked ? (
        <div
          aria-describedby={`${instructionId} ${liveRegionId}`}
          aria-disabled={disabled}
          aria-label={`${maskedLabel}, masked.`}
          className={containerClassName}
          data-kumo-component="SensitiveInput"
          data-kumo-part="masked-container"
          onClick={handleContainerClick}
          onKeyDown={handleContainerKeyDown}
          ref={containerRef}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          {content}
        </div>
      ) : (
        <div className={containerClassName} ref={containerRef}>
          {content}
        </div>
      )}
      {isMasked ? (
        <span className={cn("sr-only")} id={instructionId}>
          Click or press Enter to reveal.
        </span>
      ) : null}
      <span aria-live="polite" className={cn("sr-only")} id={liveRegionId}>
        {mode === "masked" && hasValue ? "Value hidden" : null}
        {copied ? "Copied to clipboard" : null}
      </span>
    </div>
  );

  return label ? (
    <Field
      description={description}
      error={normalizeFieldError(error)}
      label={label}
      labelTooltip={labelTooltip}
      required={required}
    >
      {control}
    </Field>
  ) : (
    control
  );
}
