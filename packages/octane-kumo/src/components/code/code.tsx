/** @jsxImportSource octane */
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";
import { resolveVariant } from "../../utils/resolve-variant";

/** Code language variant definitions. */
export const KUMO_CODE_VARIANTS = {
  lang: {
    ts: { classes: "", description: "TypeScript code" },
    tsx: { classes: "", description: "TypeScript JSX code" },
    jsonc: { classes: "", description: "JSON with comments" },
    bash: { classes: "", description: "Shell/Bash commands" },
    css: { classes: "", description: "CSS styles" },
  },
} as const;

export const KUMO_CODE_DEFAULT_VARIANTS = {
  lang: "ts",
} as const;

/** Styling metadata for Code component (for AI/Figma plugin consumption). */
export const KUMO_CODE_STYLING = {
  baseTokens: ["text-kumo-subtle"],
  typography: {
    fontFamily: "font-mono",
    fontSize: "text-sm",
    lineHeight: "leading-[20px]",
  },
  dimensions: {
    margin: "m-0",
    padding: "p-0",
    width: "w-auto",
  },
  appearance: {
    borderRadius: "rounded-none",
    border: "border-none",
    background: "bg-transparent",
  },
} as const;

/** Styling metadata for CodeBlock component (for AI/Figma plugin consumption). */
export const KUMO_CODEBLOCK_STYLING = {
  baseTokens: ["bg-kumo-base", "border-kumo-fill"],
  container: {
    minWidth: "min-w-0",
    borderRadius: "rounded-md",
    border: "border border-kumo-fill",
    background: "bg-kumo-base",
  },
  innerPadding: "[&>pre]:p-2.5",
  dimensions: {
    borderRadius: 6,
    padding: 10,
  },
} as const;

export type KumoCodeLang = keyof typeof KUMO_CODE_VARIANTS.lang;

export interface KumoCodeVariantsProps {
  lang?: KumoCodeLang;
}

export function codeVariants({
  lang = KUMO_CODE_DEFAULT_VARIANTS.lang,
}: KumoCodeVariantsProps = {}) {
  return cn(
    "m-0 w-auto rounded-none border-none bg-transparent p-0 font-mono text-sm leading-[20px] text-kumo-subtle",
    resolveVariant(
      KUMO_CODE_VARIANTS.lang,
      lang,
      KUMO_CODE_DEFAULT_VARIANTS.lang,
    ).classes,
  );
}

export type CodeLang = KumoCodeLang;

/** @deprecated Use CodeLang instead. */
export type BundledLanguage = CodeLang;

export interface CodeProps extends KumoCodeVariantsProps {
  code: string;
  values?: Record<string, { value: string; highlight?: boolean }>;
  className?: string;
  style?: JSX.IntrinsicElements["pre"]["style"];
}

function CodeComponent({
  code,
  lang = KUMO_CODE_DEFAULT_VARIANTS.lang,
  className,
  style,
}: CodeProps) {
  return (
    <pre className={cn(codeVariants({ lang }), className)} style={style}>
      {code}
    </pre>
  );
}

CodeComponent.displayName = "Code";

export interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
}

function CodeBlockComponent({ code, lang }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-kumo-fill bg-kumo-base [&>pre]:p-2.5!",
      )}
    >
      <CodeComponent lang={lang} code={code} />
    </div>
  );
}

CodeBlockComponent.displayName = "CodeBlock";

export const Code = Object.assign(CodeComponent, {
  Block: CodeBlockComponent,
});

export const CodeBlock = CodeBlockComponent;
