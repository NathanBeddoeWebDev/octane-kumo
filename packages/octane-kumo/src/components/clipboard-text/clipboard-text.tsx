/** @jsxImportSource octane */
import { Toast } from "@octanejs/base-ui/toast";
import { Tooltip } from "@octanejs/base-ui/tooltip";
import { Check, Copy } from "@octanejs/phosphor-icons";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type OctaneNode,
} from "octane";
import type { JSX } from "octane/jsx-runtime";
import { Button } from "../button/button";
import { inputVariants } from "../input/input";
import { cn } from "../../utils/cn";
import { copyText } from "../../utils/copy-text";
import { usePortalContainer } from "../../utils/portal-provider";
import { resolveVariant } from "../../utils/resolve-variant";

const COPIED_FEEDBACK_MS = 1500;

export const KUMO_CLIPBOARD_TEXT_VARIANTS = {
  size: {
    sm: { classes: "text-xs", buttonSize: "sm" as const },
    base: { classes: "text-sm", buttonSize: "base" as const },
    lg: { classes: "text-sm", buttonSize: "lg" as const },
  },
} as const;

export const KUMO_CLIPBOARD_TEXT_DEFAULT_VARIANTS = { size: "lg" } as const;
export type KumoClipboardTextSize =
  keyof typeof KUMO_CLIPBOARD_TEXT_VARIANTS.size;
export type ClipboardTextSize = KumoClipboardTextSize;

export interface ClipboardTextProps {
  text: string;
  textToCopy?: string;
  className?: string;
  size?: KumoClipboardTextSize;
  onCopy?: () => void;
  tooltip?: {
    text?: string;
    copiedText?: string;
    side?: "top" | "bottom" | "left" | "right";
  };
  labels?: { copyAction?: string };
  ref?: JSX.IntrinsicElements["div"]["ref"];
}

export function clipboardTextVariants({
  size = KUMO_CLIPBOARD_TEXT_DEFAULT_VARIANTS.size,
}: { size?: KumoClipboardTextSize } = {}) {
  return cn(
    "flex items-center overflow-hidden bg-kumo-base px-0 font-mono",
    resolveVariant(
      KUMO_CLIPBOARD_TEXT_VARIANTS.size,
      size,
      KUMO_CLIPBOARD_TEXT_DEFAULT_VARIANTS.size,
    ).classes,
  );
}

function AnchoredToasts() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal container={usePortalContainer() ?? undefined}>
      <Toast.Viewport
        className={cn("pointer-events-none fixed inset-0 isolate")}
      >
        {toasts.map((toast) => (
          <Toast.Positioner
            key={toast.id}
            toast={toast}
            className={cn("absolute")}
          >
            <Toast.Root
              key={toast.updateKey ?? 0}
              toast={toast}
              className={cn(
                "flex origin-[var(--transform-origin)] flex-col rounded-md bg-kumo-base px-3 py-1.5 font-sans text-xs text-kumo-default",
                "shadow-lg outline outline-kumo-line",
                (toast.updateKey ?? 0) > 0 && "animate-clipboard-toast-bump",
              )}
            >
              <Toast.Description />
            </Toast.Root>
          </Toast.Positioner>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function ClipboardTextInner({
  text,
  textToCopy,
  className,
  size = "lg",
  onCopy,
  tooltip,
  labels: { copyAction = "Copy to clipboard" } = {},
  ref,
  toastManager,
}: ClipboardTextProps & {
  toastManager: ReturnType<typeof Toast.createToastManager>;
}) {
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const mountedRef = useRef(true);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | null>(null);
  const sizeConfig = resolveVariant(
    KUMO_CLIPBOARD_TEXT_VARIANTS.size,
    size,
    "lg",
  );
  const tooltipText = tooltip?.text ?? "Copy";
  const copiedText = tooltip?.copiedText ?? "Copied";
  const side = tooltip?.side ?? "top";
  const portalContainer = usePortalContainer();

  useEffect(
    () => () => {
      mountedRef.current = false;
      if (resetRef.current !== null) clearTimeout(resetRef.current);
      if (toastIdRef.current !== null) toastManager.close(toastIdRef.current);
    },
    [toastManager],
  );

  const handleCopy = useCallback(async () => {
    const succeeded = await copyText(textToCopy ?? text);
    if (!succeeded || !mountedRef.current) return;
    setCopied(true);
    if (resetRef.current !== null) clearTimeout(resetRef.current);
    if (tooltip) {
      toastIdRef.current = toastManager.add({
        id: toastIdRef.current ?? undefined,
        description: copiedText,
        timeout: COPIED_FEEDBACK_MS,
        positionerProps: { anchor: buttonRef.current, side, sideOffset: 8 },
        onClose: () => {
          toastIdRef.current = null;
          if (mountedRef.current) setCopied(false);
        },
      });
    } else {
      resetRef.current = setTimeout(() => {
        if (mountedRef.current) setCopied(false);
        resetRef.current = null;
      }, COPIED_FEEDBACK_MS);
    }
    onCopy?.();
  }, [copiedText, onCopy, side, text, textToCopy, toastManager, tooltip]);

  const button: OctaneNode = (
    <Button
      ref={buttonRef}
      size={sizeConfig.buttonSize}
      variant="ghost"
      className={cn(
        "relative isolate overflow-hidden rounded-l-none rounded-r-[inherit] border-l! border-kumo-line! px-3 transition-[transform,opacity] duration-200",
        "focus:ring-kumo-focus/50 focus:ring-inset focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:ring-inset",
      )}
      onClick={handleCopy}
      aria-label={copyAction}
      aria-describedby={
        tooltip && tooltipOpen && !copied ? tooltipId : undefined
      }
    >
      <span
        className={cn(
          "flex items-center gap-1 transition-[transform,opacity] duration-200",
          copied
            ? "translate-y-0 opacity-100"
            : "pointer-events-none absolute inset-0 translate-y-full justify-center opacity-0",
        )}
      >
        <Check />
      </span>
      <span
        className={cn(
          "flex items-center justify-center transition-[transform,opacity] duration-200",
          copied
            ? "pointer-events-none absolute inset-0 -translate-y-full opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        <Copy />
      </span>
    </Button>
  );

  return (
    <div
      ref={ref}
      className={cn(
        inputVariants({ size: sizeConfig.buttonSize }),
        clipboardTextVariants({ size }),
        className,
      )}
    >
      <span className={cn("grow truncate ps-4 pe-2")}>{text}</span>
      {tooltip ? (
        <Tooltip.Provider>
          <Tooltip.Root
            disabled={copied}
            onOpenChange={(
              open: boolean,
              details: { reason: string; cancel(): void },
            ) => {
              if (details.reason === "trigger-press") {
                details.cancel();
                return;
              }
              setTooltipOpen(open);
            }}
          >
            <Tooltip.Trigger render={button} />
            <Tooltip.Portal container={portalContainer ?? undefined}>
              <Tooltip.Positioner side={side} sideOffset={8}>
                <Tooltip.Popup
                  id={tooltipId}
                  role="tooltip"
                  className={cn(
                    "flex origin-[var(--transform-origin)] flex-col rounded-md bg-kumo-base px-3 py-1.5 text-xs text-kumo-default shadow-md outline outline-kumo-line",
                  )}
                >
                  {tooltipText}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : (
        button
      )}
      <span className={cn("sr-only")} aria-live="polite">
        {copied ? copiedText : ""}
      </span>
    </div>
  );
}

export function ClipboardText(props: ClipboardTextProps) {
  const managerRef = useRef<ReturnType<typeof Toast.createToastManager> | null>(
    null,
  );
  if (managerRef.current === null)
    managerRef.current = Toast.createToastManager();
  return props.tooltip ? (
    <Toast.Provider toastManager={managerRef.current}>
      <AnchoredToasts />
      <ClipboardTextInner {...props} toastManager={managerRef.current} />
    </Toast.Provider>
  ) : (
    <ClipboardTextInner {...props} toastManager={managerRef.current} />
  );
}

ClipboardText.displayName = "ClipboardText";
