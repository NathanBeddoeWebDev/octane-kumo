/** @jsxImportSource octane */
import {
  createHighlighter,
  normalizeLanguage,
  CODE_THEMES,
} from "./highlighter";
import type { ShikiEngine, SupportedLanguage } from "./types";
import { cn } from "../utils/cn";

export interface HighlightCodeOptions {
  engine?: ShikiEngine;
}
export interface CreateHighlighterOptions extends HighlightCodeOptions {
  languages: SupportedLanguage[];
}
export interface ServerHighlighter {
  highlight: (code: string, lang: SupportedLanguage) => string;
  dispose: () => void;
}
export async function createServerHighlighter({
  engine = "javascript",
  languages,
}: CreateHighlighterOptions): Promise<ServerHighlighter> {
  const valid = [
    ...new Set(languages.filter((lang) => normalizeLanguage(lang) === lang)),
  ];
  const highlighter = await createHighlighter(engine, valid);
  return {
    highlight: (code, lang) =>
      highlighter.codeToHtml(code, { lang, themes: CODE_THEMES }),
    dispose: () => highlighter.dispose(),
  };
}
export async function highlightCode(
  code: string,
  lang: SupportedLanguage,
  options: HighlightCodeOptions = {},
): Promise<string> {
  const highlighter = await createServerHighlighter({
    ...options,
    languages: [lang],
  });
  try {
    return highlighter.highlight(code, lang);
  } finally {
    highlighter.dispose();
  }
}
export interface CodeBlockProps {
  /** Trusted HTML returned by highlightCode or ServerHighlighter.highlight. */
  html: string;
  className?: string;
}
export function CodeBlock({ html, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "group relative w-full min-w-0 rounded-md border border-kumo-fill bg-kumo-base",
        className,
      )}
    >
      <div className={cn("overflow-x-auto")}>
        <div
          className={cn(
            "kumo-shiki [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:leading-relaxed",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
