/** @jsxImportSource octane */
import { Code } from "octane-kumo";
import {
  ShikiProvider,
  CodeHighlighted,
  type ShikiEngine,
} from "octane-kumo/code";
import { CodeBlock } from "octane-kumo/code/server";

export const source =
  'const greeting = "<Hello, Octane>";\nconsole.log(greeting);';

export function CodeFixture({
  engine = "javascript",
}: {
  engine?: ShikiEngine;
}) {
  return (
    <div data-testid="code-fixture">
      <Code code={source} />
      <Code.Block code="pnpm add octane-kumo" lang="bash" />
      <ShikiProvider engine={engine} languages={["ts", "bash"]}>
        <CodeHighlighted
          code={source}
          lang="ts"
          showLineNumbers
          highlightLines={[2]}
          showCopyButton
        />
        <CodeHighlighted
          code="pnpm add octane-kumo"
          lang="sh"
          showCopyButton
          labels={{ copy: "Copy install", copied: "Install copied" }}
        />
      </ShikiProvider>
    </div>
  );
}

export function ServerCodeFixture({ html }: { html: string }) {
  return <CodeBlock html={html} />;
}
