/** @jsxImportSource octane */
import { Check, Copy } from "@octanejs/phosphor-icons";
import { useEffect, useState, type OctaneNode } from "octane";
import { Button } from "../button/button";
import { cn } from "../../utils/cn";
import { copyText } from "../../utils/copy-text";
import { resolveVariant } from "../../utils/resolve-variant";

export const KUMO_EMPTY_VARIANTS = {
  size: {
    sm: {
      classes: "px-6 py-8 gap-4",
      description: "Compact empty state for smaller containers",
    },
    base: {
      classes: "px-10 py-16 gap-6",
      description: "Default empty state size",
    },
    lg: {
      classes: "px-12 py-20 gap-8",
      description: "Large empty state for prominent placement",
    },
  },
} as const;

export const KUMO_EMPTY_DEFAULT_VARIANTS = {
  size: "base",
} as const;

export type KumoEmptySize = keyof typeof KUMO_EMPTY_VARIANTS.size;

export interface KumoEmptyVariantsProps {
  size?: KumoEmptySize;
}

export function emptyVariants({
  size = KUMO_EMPTY_DEFAULT_VARIANTS.size,
}: KumoEmptyVariantsProps = {}) {
  return cn(
    "flex w-full flex-col items-center rounded-xl border border-kumo-fill bg-kumo-control text-kumo-default",
    resolveVariant(
      KUMO_EMPTY_VARIANTS.size,
      size,
      KUMO_EMPTY_DEFAULT_VARIANTS.size,
    ).classes,
  );
}

export interface EmptyProps extends KumoEmptyVariantsProps {
  className?: string;
  commandLine?: string;
  contents?: OctaneNode;
  description?: string;
  icon?: OctaneNode;
  title: string;
}

export function Empty({
  icon,
  title,
  description,
  commandLine,
  contents,
  size = KUMO_EMPTY_DEFAULT_VARIANTS.size,
  className,
}: EmptyProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    if (commandLine && (await copyText(commandLine))) setCopied(true);
  }

  return (
    <div
      className={cn(emptyVariants({ size }), className)}
      data-kumo-component="Empty"
    >
      {icon}
      <h2 className={cn("text-2xl font-semibold")}>{title}</h2>
      {description ? (
        <p className={cn("max-w-140 text-center text-kumo-subtle")}>
          {description}
        </p>
      ) : null}
      {commandLine ? (
        <div
          className={cn(
            "group/cmd relative inline-flex h-10 max-w-8/10 transform-gpu items-center gap-2 rounded-lg border border-kumo-fill/60 bg-kumo-overlay pr-2 pl-3 font-mono shadow-sm transition-all duration-300 hover:border-kumo-interact/80 hover:shadow-md",
          )}
          data-kumo-part="command"
        >
          <span className={cn("text-xs text-kumo-inactive select-none")}>
            $
          </span>
          <span
            className={cn(
              "no-scrollbar overflow-scroll text-base whitespace-nowrap text-kumo-brand",
            )}
          >
            {commandLine}
          </span>
          <Button
            aria-label={copied ? "Copied" : "Copy command"}
            className={cn("group")}
            onClick={handleCopy}
            shape="square"
            size="sm"
            variant="ghost"
          >
            {copied ? (
              <Check
                aria-hidden="true"
                className={cn("animate-bounce-in text-kumo-success")}
                size={16}
              />
            ) : (
              <Copy
                aria-hidden="true"
                className={cn("text-kumo-inactive group-hover:text-kumo-brand")}
                size={16}
              />
            )}
          </Button>
          <span aria-live="polite" className={cn("sr-only")}>
            {copied ? "Copied command to clipboard" : null}
          </span>
        </div>
      ) : null}
      {contents != null ? (
        <span className={cn("contents")}>{contents}</span>
      ) : null}
    </div>
  );
}
