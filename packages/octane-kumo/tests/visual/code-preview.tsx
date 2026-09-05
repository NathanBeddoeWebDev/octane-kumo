/** @jsxImportSource octane */
import { createRoot, useEffect, useState } from "octane";
import { ShikiProvider, CodeHighlighted } from "octane-kumo/code";
import { highlightCode } from "octane-kumo/code/server";
import { CodeFixture, ServerCodeFixture, source } from "../fixtures/code";

function Preview() {
  const [html, setHtml] = useState("");
  // Exercise the server renderer with real generated HTML in this visual harness.
  useEffect(() => {
    void highlightCode(source, "typescript").then(setHtml);
  }, []);
  return (
    <main>
      {(["light", "dark"] as const).map((mode) => (
        <section key={mode} data-mode={mode}>
          <h1>
            {mode === "light" ? "Light · JavaScript" : "Dark · WASM"} code
            display
          </h1>
          <CodeFixture engine={mode === "light" ? "javascript" : "wasm"} />
          <ShikiProvider engine="javascript" languages={["json"]}>
            <h2>Long line · contained scrolling</h2>
            <CodeHighlighted
              code={
                '{ "route": "api.example.com/resources/long-path/without/wrapping/into/the/copy/control", "enabled": true }'
              }
              lang="json"
              showCopyButton
            />
            <h2>Unconfigured language · plain text</h2>
            <CodeHighlighted
              code={
                "<unconfigured>\n  Still readable and safe\n</unconfigured>"
              }
              lang="html"
              showLineNumbers
              showCopyButton
              labels={{ copy: "Copy fallback" }}
            />
          </ShikiProvider>
          <h2>Pre-highlighted HTML · server renderer</h2>
          <ServerCodeFixture html={html} />
        </section>
      ))}
    </main>
  );
}
createRoot(document.getElementById("app")!).render(Preview);
