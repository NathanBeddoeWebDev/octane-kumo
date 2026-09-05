/** @jsxImportSource octane */
import { cleanup, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  createServerHighlighter,
  highlightCode,
  CodeBlock,
} from "../src/code/server";
import { ShikiProvider, CodeHighlighted } from "../src/code";

afterEach(cleanup);
describe("real Shiki engines", () => {
  it.each(["javascript", "wasm"] as const)(
    "highlights safely with the %s engine and both themes",
    async (engine) => {
      const source = 'const tag = "<script>not executable</script>";';
      const html = await highlightCode(source, "typescript", { engine });
      const view = render(CodeBlock, { props: { html } });
      expect(view.container.querySelector("code")?.textContent).toBe(source);
      expect(view.container.querySelector("script")).toBeNull();
      expect(html).toContain("--shiki-dark:");
      expect(
        view.container.querySelector("pre.github-light.vesper"),
      ).toBeTruthy();
      expect(
        view.container.querySelectorAll("span[style]").length,
      ).toBeGreaterThan(1);
    },
    15000,
  );
  it("supports reusable server highlighting and the shell grammar name", async () => {
    const highlighter = await createServerHighlighter({
      languages: ["shell", "json"],
    });
    try {
      expect(highlighter.highlight("echo hello", "shell")).toContain("hello");
      expect(highlighter.highlight('{"ok":true}', "json")).toContain("ok");
    } finally {
      highlighter.dispose();
    }
  });
  it("loads real client highlighting after an escaped plain-text fallback", async () => {
    const view = render(() => (
      <ShikiProvider engine="javascript" languages={["ts"]}>
        <CodeHighlighted
          code={'const safe = "<b>";\nconst value = 42;'}
          lang="ts"
          showLineNumbers
          highlightLines={[2]}
        />
      </ShikiProvider>
    ));
    expect(view.container.querySelector(".shiki")).toBeNull();
    await screen.findByText("42");
    expect(view.container.querySelectorAll(".line-highlighted")).toHaveLength(
      1,
    );
    expect(
      view.container.querySelectorAll(".kumo-line-numbers > div"),
    ).toHaveLength(2);
    expect(view.container.querySelector("b")).toBeNull();
  }, 15000);
});
