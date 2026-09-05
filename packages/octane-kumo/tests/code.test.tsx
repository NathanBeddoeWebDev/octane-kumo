/** @jsxImportSource octane */
import { cleanup, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Code, CodeBlock, codeVariants } from "../src/components/code/code";

afterEach(cleanup);

describe("Code", () => {
  it("renders code with the default styles and custom native styling", () => {
    render(Code, {
      props: {
        className: "custom-code",
        code: "const answer = 42;",
        style: { color: "red" },
      },
    });

    const code = screen.getByText("const answer = 42;");
    expect(code.tagName).toBe("PRE");
    expect(code.classList.contains("font-mono")).toBe(true);
    expect(code.classList.contains("text-kumo-subtle")).toBe(true);
    expect(code.classList.contains("custom-code")).toBe(true);
    expect(code.style.color).toBe("red");
  });

  it("renders markup-like code as escaped text", () => {
    const source = '<script>alert("unsafe")</script>';
    render(Code, { props: { code: source } });

    const pre = document.querySelector("pre")!;
    expect(pre.textContent).toBe(source);
    expect(pre.querySelector("script")).toBeNull();
    expect(pre.innerHTML).toContain("&lt;script&gt;");
  });

  it("accepts language variants and ignores legacy template values", () => {
    const source = "export API_KEY={{apiKey}}";
    render(Code, {
      props: {
        code: source,
        lang: "bash",
        values: { apiKey: { value: "secret", highlight: true } },
      },
    });

    expect(screen.getByText(source).textContent).toBe(source);
    expect(codeVariants({ lang: "css" })).toBe(codeVariants({ lang: "ts" }));
  });

  it("preserves the standalone and compound CodeBlock identity", () => {
    expect(Code.Block).toBe(CodeBlock);

    render(Code.Block, { props: { code: "type Result = true;", lang: "tsx" } });
    const pre = screen.getByText("type Result = true;");
    const container = pre.parentElement!;
    expect(container.tagName).toBe("DIV");
    expect(container.classList.contains("rounded-md")).toBe(true);
    expect(container.classList.contains("border-kumo-fill")).toBe(true);
    expect(container.classList.contains("[&>pre]:p-2.5!")).toBe(true);
  });
});
