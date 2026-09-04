/** @jsxImportSource octane */
import { Field as FieldBase } from "@octanejs/base-ui/field";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Field, normalizeFieldError, type FieldError } from "../field/field";
import { cn } from "../../utils/cn";
import {
  inputVariants,
  type KumoInputSize,
  type KumoInputVariant,
} from "./input";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function useTextareaAutoResize({
  enabled,
  maxRows,
  minRows,
}: {
  enabled: boolean;
  maxRows?: number;
  minRows: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const enabledRef = useRef(enabled);
  const maxRowsRef = useRef(maxRows);
  const minRowsRef = useRef(minRows);
  enabledRef.current = enabled;
  maxRowsRef.current = maxRows;
  minRowsRef.current = minRows;

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!enabledRef.current || !textarea || typeof window === "undefined")
      return;

    const style = window.getComputedStyle(textarea);
    const borders =
      parsePx(style.borderTopWidth) + parsePx(style.borderBottomWidth);
    const padding = parsePx(style.paddingTop) + parsePx(style.paddingBottom);
    const isBorderBox = style.boxSizing === "border-box";

    textarea.style.height = "auto";
    let height = isBorderBox
      ? textarea.scrollHeight + borders
      : textarea.scrollHeight - padding;

    const currentMaxRows = maxRowsRef.current;
    const currentMinRows = minRowsRef.current;
    if (currentMinRows > 0 || (currentMaxRows && currentMaxRows > 0)) {
      const fontSize = parsePx(style.fontSize);
      const rawLineHeight = style.lineHeight;
      const lineHeight =
        rawLineHeight === "normal" || rawLineHeight === ""
          ? fontSize * 1.2
          : rawLineHeight.endsWith("px")
            ? parsePx(rawLineHeight)
            : parsePx(rawLineHeight) * fontSize;
      const boxSpacing = isBorderBox ? padding + borders : 0;
      height = Math.max(height, lineHeight * currentMinRows + boxSpacing);

      if (currentMaxRows && currentMaxRows > 0) {
        const maxHeight = lineHeight * currentMaxRows + boxSpacing;
        if (height > maxHeight) {
          height = maxHeight;
          textarea.style.overflowY = "auto";
        } else {
          textarea.style.overflowY = "hidden";
        }
      } else {
        textarea.style.overflowY = "hidden";
      }
    } else {
      textarea.style.overflowY = "hidden";
    }

    textarea.style.height = `${height}px`;
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (enabled) resize();
  });

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    let lastWidth = textarea.clientWidth;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (textarea.clientWidth !== lastWidth) {
              lastWidth = textarea.clientWidth;
              resize();
            }
          });
    observer?.observe(textarea);

    return () => {
      observer?.disconnect();
      textarea.style.height = "";
      textarea.style.overflowY = "";
    };
  }, [enabled, resize]);

  return { resize, textareaRef };
}

type NativeTextareaProps = JSX.IntrinsicElements["textarea"];
type TextareaRef = NonNullable<NativeTextareaProps["ref"]>;
type NativeInputEvent = InputEvent & {
  currentTarget: HTMLTextAreaElement;
};

function isTextareaRefArray(
  ref: TextareaRef,
): ref is Extract<TextareaRef, readonly unknown[]> {
  return Array.isArray(ref);
}

function assignTextareaRef(
  ref: TextareaRef | null | undefined,
  node: HTMLTextAreaElement,
): (() => void) | undefined {
  if (!ref) return undefined;
  if (isTextareaRefArray(ref)) {
    const cleanups = ref.flatMap((item) => {
      const cleanup = assignTextareaRef(item, node);
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

export type InputAreaProps = Omit<NativeTextareaProps, "size"> & {
  autoResize?: boolean;
  description?: OctaneNode;
  error?: string | FieldError;
  label?: OctaneNode;
  labelTooltip?: OctaneNode;
  maxRows?: number;
  minRows?: number;
  onValueChange?: (value: string) => void;
  size?: KumoInputSize;
  variant?: KumoInputVariant;
};

export function InputArea({
  autoResize = false,
  className,
  description,
  error,
  label,
  labelTooltip,
  maxRows,
  minRows = 1,
  onInput,
  onValueChange,
  ref,
  rows,
  size = "base",
  variant: variantProp,
  ...textareaProps
}: InputAreaProps) {
  if (process.env.NODE_ENV !== "production" && variantProp === "error") {
    console.warn(
      '[Kumo InputArea]: variant="error" is deprecated. ' +
        "Error styling is now automatically applied when the `error` prop is truthy. " +
        "Simply remove the variant prop and pass an error message instead.",
    );
  }

  const variant = variantProp ?? (error ? "error" : "default");
  const { resize, textareaRef } = useTextareaAutoResize({
    enabled: autoResize,
    maxRows,
    minRows,
  });
  const refCleanup = useRef<(() => void) | undefined>(undefined);
  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (!node) {
        refCleanup.current?.();
        return;
      }

      textareaRef.current = node;
      const externalCleanup = assignTextareaRef(ref, node);
      refCleanup.current = () => {
        if (textareaRef.current === node) textareaRef.current = null;
        externalCleanup?.();
        refCleanup.current = undefined;
      };
      return refCleanup.current;
    },
    [ref, textareaRef],
  );
  const isControlled = textareaProps.value !== undefined;
  const textareaClassName = cn(
    inputVariants({ focusIndicator: true, size, variant }),
    "h-auto py-2",
    autoResize &&
      "field-sizing-content w-full resize-none scroll-pb-2 [scrollbar-color:var(--color-kumo-line)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-kumo-line [&::-webkit-scrollbar-track]:my-2",
    className,
  );
  const textareaRows = autoResize ? minRows : rows;

  const handleInput = (event: NativeInputEvent) => {
    onInput?.(event);
    onValueChange?.(event.currentTarget.value);
    if (!isControlled) resize();
  };

  if (label || error || description) {
    return (
      <Field
        description={description}
        error={normalizeFieldError(error)}
        label={label}
        labelTooltip={labelTooltip}
        required={textareaProps.required}
      >
        <FieldBase.Control
          {...textareaProps}
          className={textareaClassName}
          onInput={onInput}
          onValueChange={(value: string) => {
            onValueChange?.(value);
            if (!isControlled) resize();
          }}
          ref={setTextareaRef}
          render={<textarea />}
          rows={textareaRows}
        />
      </Field>
    );
  }

  return (
    <textarea
      {...textareaProps}
      className={textareaClassName}
      onInput={handleInput}
      ref={setTextareaRef}
      rows={textareaRows}
    />
  );
}

export const Textarea = InputArea;
