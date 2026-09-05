/** @jsxImportSource octane */
import { createRoot, useState, useEffect } from "octane";
import { Button, Flow } from "octane-kumo";
import { cn } from "../../src/utils/cn";

function Example() {
  const [dark, setDark] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [extra, setExtra] = useState(false);
  const [end, setEnd] = useState(false);
  const [overflow, setOverflow] = useState({ x: false, y: false });
  useEffect(() => {
    document.documentElement.dataset.mode = dark ? "dark" : "light";
  }, [dark]);
  return (
    <main>
      <h1>Workflow diagram</h1>
      <div className={cn("flex flex-wrap gap-2")}>
        <Button onClick={() => setDark(!dark)}>
          Switch to {dark ? "light" : "dark"}
        </Button>
        <Button onClick={() => setVertical(!vertical)}>
          Toggle orientation
        </Button>
        <Button onClick={() => setExtra(!extra)}>Toggle extra step</Button>
        <Button onClick={() => setEnd(!end)}>Toggle branch alignment</Button>
      </div>
      <output>
        Overflow: {overflow.x ? "x" : ""}
        {overflow.y ? "y" : ""}
      </output>
      <section
        className={cn("mt-6 rounded-xl bg-kumo-base ring ring-kumo-line")}
      >
        <Flow
          orientation={vertical ? "vertical" : "horizontal"}
          align="center"
          onOverflowChange={setOverflow}
          className={cn("h-96")}
        >
          <Flow.Node id="receive">Receive</Flow.Node>
          <Flow.Parallel align={end ? "end" : undefined}>
            <Flow.Node id="validate">Validate</Flow.Node>
            <Flow.List>
              <Flow.Node id="transform">Transform</Flow.Node>
              <Flow.Node id="archive" disabled>
                Archive
              </Flow.Node>
            </Flow.List>
          </Flow.Parallel>
          {extra && <Flow.Node id="extra">Additional review</Flow.Node>}
          <Flow.Node
            id="complete"
            render={
              <button
                className={cn(
                  "rounded-md bg-kumo-control px-3 py-2 text-base ring ring-kumo-line",
                )}
                onClick={() => setExtra(!extra)}
              />
            }
          >
            <Flow.Anchor>Complete</Flow.Anchor>
          </Flow.Node>
        </Flow>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Example />);
