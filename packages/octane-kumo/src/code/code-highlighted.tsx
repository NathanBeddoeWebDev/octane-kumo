/** @jsxImportSource octane */
import { useState, useEffect, useMemo, useRef } from "octane";
import { cn } from "../utils/cn";
import { Button } from "../components/button";
import { copyText } from "../utils/copy-text";
import { useShikiHighlighter } from "./provider";
import type { CodeHighlightedProps } from "./types";

export function CodeHighlighted({
  code,
  lang,
  showLineNumbers = false,
  highlightLines,
  showCopyButton = false,
  labels: overrides,
  className,
}: CodeHighlightedProps) {
  const {
    highlight,
    isLoading,
    error,
    labels: providerLabels,
  } = useShikiHighlighter();
  const [copied, setCopied] = useState(false);
  const [copyFocused, setCopyFocused] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timeout.current !== null) clearTimeout(timeout.current);
    };
  }, []);
  const labels = { ...providerLabels, ...overrides };
  const html = useMemo(() => highlight(code, lang), [highlight, code, lang]);
  const lineCount = code.split("\n").length;
  const singleLine = lineCount === 1;
  let highlighted = html;
  if (highlighted && highlightLines?.length) {
    const lines = new Set(highlightLines);
    let number = 0;
    highlighted = highlighted.replace(/<span class="line">/g, () =>
      lines.has(++number)
        ? '<span class="line line-highlighted">'
        : '<span class="line">',
    );
  }
  useEffect(() => {
    if (error)
      console.error(
        "[Kumo CodeHighlighted] Shiki initialization error:",
        error,
      );
  }, [error]);
  async function handleCopy() {
    if (!(await copyText(code)) || !mounted.current) return;
    setCopied(true);
    if (timeout.current !== null) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div
      className={cn(
        "group relative m-0 w-full min-w-0 rounded-md border border-kumo-fill bg-kumo-base p-0",
        showCopyButton && "flex",
        showCopyButton && (singleLine ? "items-center" : "items-start"),
        className,
      )}
    >
      <div className={cn("flex w-full min-w-0")}>
        {showLineNumbers && !singleLine && (
          <div
            className={cn(
              "kumo-line-numbers shrink-0 py-4 pr-4 text-right font-mono text-sm opacity-40 select-none",
            )}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index} className={cn("leading-relaxed")}>
                {index + 1}
              </div>
            ))}
          </div>
        )}
        <div className={cn("min-w-0 flex-1 overflow-x-auto")}>
          {!isLoading && highlighted !== null ? (
            <div
              className={cn(
                "kumo-shiki [&_code]:!m-0 [&_code]:!border-0 [&_code]:!bg-transparent [&_code]:!p-0 [&>pre]:!m-0 [&>pre]:!rounded-none [&>pre]:!border-0 [&>pre]:!bg-transparent [&>pre]:!p-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:leading-relaxed",
              )}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          ) : (
            <pre
              className={cn(
                "!m-0 min-w-0 flex-1 overflow-x-auto !p-4 font-mono text-sm leading-relaxed text-kumo-subtle",
              )}
            >
              <code className={cn("!m-0 !p-0")}>{code}</code>
            </pre>
          )}
        </div>
      </div>
      {showCopyButton && (
        <div
          className={cn(
            "shrink-0 px-2",
            !singleLine && "py-2",
            !copied &&
              !copyFocused &&
              "opacity-0 transition-opacity group-hover:opacity-100",
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            onFocus={() => setCopyFocused(true)}
            onBlur={() => setCopyFocused(false)}
            aria-label={copied ? labels.copied : labels.copy}
          >
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
      )}
    </div>
  );
}
