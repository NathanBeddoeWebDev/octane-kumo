/** @jsxImportSource octane */
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@octanejs/testing-library";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import type { HighlighterCore } from "shiki/core";
import {
  ShikiProvider,
  CodeHighlighted,
  useShikiHighlighter,
  normalizeLanguage,
} from "../src/code";
import { createHighlighter } from "../src/code/highlighter";
import type { ShikiEngine, LanguageInput } from "../src/code";

vi.mock("../src/code/highlighter", async (original) => ({
  ...(await original<typeof import("../src/code/highlighter")>()),
  createHighlighter: vi.fn(),
}));
function engine() {
  const dispose = vi.fn();
  const codeToHtml = vi.fn(
    (code: string) =>
      `<pre><code><span class="line">${code}</span>\n<span class="line">second</span></code></pre>`,
  );
  return {
    dispose,
    codeToHtml,
    value: { dispose, codeToHtml } as unknown as HighlighterCore,
  };
}
function deferred() {
  let resolve!: (value: HighlighterCore) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<HighlighterCore>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function State() {
  const { isLoading, isReady, error } = useShikiHighlighter();
  return (
    <output>
      {error ? "error" : isLoading ? "loading" : isReady ? "ready" : "idle"}
    </output>
  );
}
function Fixture({
  languages = ["ts"],
  choice = "javascript",
  code = "first",
  lang = "ts",
}: {
  languages?: LanguageInput[];
  choice?: ShikiEngine;
  code?: string;
  lang?: string;
}) {
  return (
    <ShikiProvider
      engine={choice}
      languages={languages}
      labels={{ copy: "Copy source", copied: "Done" }}
    >
      <State />
      <CodeHighlighted
        code={code}
        lang={lang}
        showLineNumbers
        highlightLines={[2]}
        showCopyButton
        labels={{ copied: "Copied source" }}
      />
    </ShikiProvider>
  );
}
beforeEach(() => vi.mocked(createHighlighter).mockReset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("native highlighting lifecycle", () => {
  it("normalizes aliases but rejects inherited object names and unsupported languages", () => {
    expect(normalizeLanguage("cts")).toBe("typescript");
    expect(normalizeLanguage("sh")).toBe("bash");
    expect(normalizeLanguage("shell")).toBe("shell");
    for (const lang of [
      "constructor",
      "toString",
      "__proto__",
      "rust",
      "mdx",
      "",
    ])
      expect(normalizeLanguage(lang)).toBeNull();
  });
  it("requires a provider", () => {
    expect(() => render(State)).toThrow(/ShikiProvider/);
  });
  it("deduplicates equivalent language inputs, caches highlighting and disposes on unmount", async () => {
    const highlighter = engine();
    vi.mocked(createHighlighter).mockResolvedValue(highlighter.value);
    const view = render(Fixture, {
      props: { languages: ["ts", "typescript", "cts"] },
    });
    await screen.findByText("ready");
    expect(createHighlighter).toHaveBeenCalledWith("javascript", [
      "typescript",
    ]);
    const calls = highlighter.codeToHtml.mock.calls.length;
    view.rerender({ props: { languages: ["typescript", "ts"] } });
    expect(createHighlighter).toHaveBeenCalledTimes(1);
    expect(highlighter.codeToHtml).toHaveBeenCalledTimes(calls);
    expect(view.container.querySelectorAll(".line-highlighted")).toHaveLength(
      1,
    );
    view.unmount();
    expect(highlighter.dispose).toHaveBeenCalledTimes(1);
  });
  it("replaces an initialized engine with fallback until its replacement is ready", async () => {
    const previous = engine();
    const next = deferred();
    vi.mocked(createHighlighter)
      .mockResolvedValueOnce(previous.value)
      .mockReturnValueOnce(next.promise);
    const view = render(Fixture);
    await screen.findByText("ready");
    view.rerender({ props: { languages: ["json"], lang: "json" } });
    expect(previous.dispose).toHaveBeenCalledTimes(1);
    expect(screen.getByText("loading")).toBeTruthy();
    expect(view.container.querySelector(".kumo-shiki")).toBeNull();
    const current = engine();
    await act(async () => next.resolve(current.value));
    expect(screen.getByText("ready")).toBeTruthy();
    expect(current.codeToHtml).toHaveBeenCalledWith(
      "first",
      expect.objectContaining({ lang: "json" }),
    );
    view.unmount();
    expect(current.dispose).toHaveBeenCalledTimes(1);
  });
  it("disposes late initialization on reconfiguration and after unmount", async () => {
    const first = deferred();
    const next = deferred();
    vi.mocked(createHighlighter)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(next.promise);
    const view = render(Fixture);
    view.rerender({ props: { choice: "wasm", languages: ["json"] } });
    const obsolete = engine();
    const current = engine();
    await act(async () => first.resolve(obsolete.value));
    expect(obsolete.dispose).toHaveBeenCalledTimes(1);
    expect(obsolete.codeToHtml).not.toHaveBeenCalled();
    expect(screen.getByText("loading")).toBeTruthy();
    view.unmount();
    await act(async () => next.resolve(current.value));
    expect(current.dispose).toHaveBeenCalledTimes(1);
  });
  it("falls back during errors and retries without retaining the old error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createHighlighter).mockRejectedValueOnce(
      new Error("engine unavailable"),
    );
    const view = render(Fixture, {
      props: { code: '<script>alert("x")</script>' },
    });
    await screen.findByText("error");
    expect(view.container.querySelector("script")).toBeNull();
    const retry = deferred();
    vi.mocked(createHighlighter).mockReturnValueOnce(retry.promise);
    view.rerender({ props: { choice: "wasm", code: "safe" } });
    expect(screen.getByText("loading")).toBeTruthy();
    const highlighter = engine();
    await act(async () => retry.resolve(highlighter.value));
    expect(screen.getByText("ready")).toBeTruthy();
  });
  it("falls back for unconfigured languages and highlighting exceptions", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const highlighter = engine();
    vi.mocked(createHighlighter).mockResolvedValue(highlighter.value);
    const view = render(Fixture, { props: { lang: "rust" } });
    await screen.findByText("ready");
    expect(highlighter.codeToHtml).not.toHaveBeenCalled();
    expect(view.container.querySelector("pre code")?.textContent).toBe("first");
    highlighter.codeToHtml.mockImplementation(() => {
      throw new Error("bad grammar");
    });
    view.rerender({ props: { lang: "ts" } });
    expect(view.container.querySelector("pre code")?.textContent).toBe("first");
  });
  it("copies raw source, merges labels, reveals keyboard focus and cleans up its reset timer", async () => {
    const highlighter = engine();
    vi.mocked(createHighlighter).mockResolvedValue(highlighter.value);
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const view = render(Fixture, { props: { code: "first\nsecond" } });
    await screen.findByText("ready");
    const button = screen.getByRole("button", { name: "Copy source" });
    fireEvent.focus(button);
    expect(button.parentElement?.className).not.toContain("opacity-0");
    vi.useFakeTimers();
    const schedule = vi.spyOn(globalThis, "setTimeout");
    const cancel = vi.spyOn(globalThis, "clearTimeout");
    fireEvent.click(button);
    await act(async () => {});
    expect(write).toHaveBeenCalledWith("first\nsecond");
    expect(screen.getByRole("button", { name: "Copied source" })).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy source" })).toBeTruthy();
    fireEvent.click(button);
    await act(async () => {});
    const resetIndex = schedule.mock.calls.findLastIndex(
      (call) => call[1] === 2000,
    );
    expect(resetIndex).toBeGreaterThanOrEqual(0);
    const resetTimer = schedule.mock.results[resetIndex].value;
    view.unmount();
    expect(cancel).toHaveBeenCalledWith(resetTimer);
  });
  it("never reports success when both clipboard paths fail", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(createHighlighter).mockResolvedValue(engine().value);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(Fixture);
    await screen.findByText("ready");
    fireEvent.click(screen.getByRole("button", { name: "Copy source" }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalled(),
    );
    expect(screen.queryByRole("button", { name: "Copied source" })).toBeNull();
  });
});
