/** @jsxImportSource octane */
import { Flow } from "../../src/components/flow";

export function FlowFixture() {
  return (
    <div data-testid="flow-fixture">
      <Flow canvas={false}>
        <Flow.Node id="server-start">Start</Flow.Node>
        <Flow.Node id="server-end">End</Flow.Node>
      </Flow>
    </div>
  );
}
