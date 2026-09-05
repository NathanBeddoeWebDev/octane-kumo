import type { HighlighterCore } from "shiki/core";
import {
  LANGUAGE_ALIASES,
  type LanguageAlias,
  type ShikiEngine,
  type SupportedLanguage,
} from "./types";

const BUNDLED_LANGS = {
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  jsx: () => import("@shikijs/langs/jsx"),
  tsx: () => import("@shikijs/langs/tsx"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  python: () => import("@shikijs/langs/python"),
  yaml: () => import("@shikijs/langs/yaml"),
  markdown: () => import("@shikijs/langs/markdown"),
  graphql: () => import("@shikijs/langs/graphql"),
  sql: () => import("@shikijs/langs/sql"),
  bash: () => import("@shikijs/langs/bash"),
  shell: () => import("@shikijs/langs/shellscript"),
  diff: () => import("@shikijs/langs/diff"),
  hcl: () => import("@shikijs/langs/hcl"),
  toml: () => import("@shikijs/langs/toml"),
};

export const CODE_THEMES = { light: "github-light", dark: "vesper" } as const;

export function normalizeLanguage(lang: string): SupportedLanguage | null {
  if (Object.hasOwn(BUNDLED_LANGS, lang)) return lang as SupportedLanguage;
  if (Object.hasOwn(LANGUAGE_ALIASES, lang))
    return LANGUAGE_ALIASES[lang as LanguageAlias];
  return null;
}

/** Shared lazy engine initialization for client providers and server utilities. */
export async function createHighlighter(
  engine: ShikiEngine,
  languages: SupportedLanguage[],
): Promise<HighlighterCore> {
  const { createHighlighterCore } = await import("shiki/core");
  const engineInstance =
    engine === "wasm"
      ? await import("shiki/engine/oniguruma").then((m) =>
          m.createOnigurumaEngine(import("shiki/wasm")),
        )
      : await import("shiki/engine/javascript").then((m) =>
          m.createJavaScriptRegexEngine(),
        );
  const [light, dark, ...langs] = await Promise.all([
    import("@shikijs/themes/github-light"),
    import("@shikijs/themes/vesper"),
    ...languages.map((lang) => BUNDLED_LANGS[lang]()),
  ]);
  return createHighlighterCore({
    engine: engineInstance,
    themes: [light.default, dark.default],
    langs: langs.map((lang) => lang.default),
  });
}
