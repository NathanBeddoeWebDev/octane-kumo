/** @jsxImportSource octane */
import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "octane";
import type { HighlighterCore } from "shiki/core";
import {
  createHighlighter,
  normalizeLanguage,
  CODE_THEMES,
} from "./highlighter";
import type {
  CodeHighlightedLabels,
  ShikiProviderProps,
  SupportedLanguage,
  UseShikiHighlighterResult,
} from "./types";

interface HighlighterState {
  highlighter: HighlighterCore | null;
  isLoading: boolean;
  error: Error | null;
  languages: SupportedLanguage[];
}
const ShikiContext = createContext<
  (HighlighterState & { labels: CodeHighlightedLabels }) | null
>(null);

export function ShikiProvider({
  engine,
  languages,
  labels,
  children,
}: ShikiProviderProps) {
  const [state, setState] = useState<HighlighterState>({
    highlighter: null,
    isLoading: true,
    error: null,
    languages: [],
  });
  const languageKey = [
    ...new Set(
      languages
        .map(normalizeLanguage)
        .filter((lang): lang is SupportedLanguage => lang !== null),
    ),
  ]
    .sort()
    .join(",");
  useEffect(() => {
    let cancelled = false;
    let owned: HighlighterCore | null = null;
    const validLanguages = languageKey
      ? (languageKey.split(",") as SupportedLanguage[])
      : [];
    setState({
      highlighter: null,
      isLoading: true,
      error: null,
      languages: [],
    });
    void createHighlighter(engine, validLanguages).then(
      (highlighter) => {
        if (cancelled) {
          highlighter.dispose();
          return;
        }
        owned = highlighter;
        setState({
          highlighter,
          isLoading: false,
          error: null,
          languages: validLanguages,
        });
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            highlighter: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load Shiki"),
            languages: [],
          });
      },
    );
    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, [engine, languageKey]);
  const value = useMemo(
    () => ({
      ...state,
      labels: { copy: "Copy", copied: "Copied!", ...labels },
    }),
    [state, labels],
  );
  return (
    <ShikiContext.Provider value={value}>{children}</ShikiContext.Provider>
  );
}

export function useShikiHighlighter(): UseShikiHighlighterResult {
  const context = useContext(ShikiContext);
  if (!context)
    throw new Error(
      "useShikiHighlighter must be used within a ShikiProvider from 'octane-kumo/code'.",
    );
  const { highlighter, languages, isLoading, error, labels } = context;
  const highlight = useCallback(
    (code: string, lang: string): string | null => {
      if (!highlighter) return null;
      const normalized = normalizeLanguage(lang);
      if (!normalized || !languages.includes(normalized)) {
        console.warn(
          `[Kumo CodeHighlighted] Language "${lang}" is not in the ShikiProvider's languages list. Rendering as plain text.`,
        );
        return null;
      }
      try {
        return highlighter.codeToHtml(code, {
          lang: normalized,
          themes: CODE_THEMES,
        });
      } catch (error) {
        console.warn(
          `[Kumo CodeHighlighted] Failed to highlight code with language "${lang}":`,
          error,
        );
        return null;
      }
    },
    [highlighter, languages],
  );
  return {
    highlight,
    isLoading,
    isReady: !isLoading && highlighter !== null,
    error,
    labels,
  };
}
