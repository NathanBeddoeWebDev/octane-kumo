/** @jsxImportSource octane */
import type { OctaneNode } from "octane";

export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "jsonc"
  | "html"
  | "css"
  | "python"
  | "yaml"
  | "markdown"
  | "graphql"
  | "sql"
  | "bash"
  | "shell"
  | "diff"
  | "hcl"
  | "toml";

export const LANGUAGE_ALIASES = {
  js: "javascript",
  cjs: "javascript",
  mjs: "javascript",
  ts: "typescript",
  cts: "typescript",
  mts: "typescript",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  py: "python",
  md: "markdown",
  gql: "graphql",
} as const satisfies Record<string, SupportedLanguage>;

export type LanguageAlias = keyof typeof LANGUAGE_ALIASES;
export type LanguageInput = SupportedLanguage | LanguageAlias;
export type ShikiEngine = "javascript" | "wasm";
export interface CodeHighlightedLabels {
  copy?: string;
  copied?: string;
}
export interface ShikiProviderProps {
  engine: ShikiEngine;
  languages: LanguageInput[];
  labels?: CodeHighlightedLabels;
  children: OctaneNode;
}
export interface UseShikiHighlighterResult {
  highlight: (
    code: string,
    lang: LanguageInput | (string & {}),
  ) => string | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  labels: CodeHighlightedLabels;
}
export interface CodeHighlightedProps {
  code: string;
  lang: LanguageInput | (string & {});
  showLineNumbers?: boolean;
  highlightLines?: number[];
  showCopyButton?: boolean;
  labels?: CodeHighlightedLabels;
  className?: string;
}
/** @deprecated Use SupportedLanguage instead. */
export type BundledLanguage = SupportedLanguage;
