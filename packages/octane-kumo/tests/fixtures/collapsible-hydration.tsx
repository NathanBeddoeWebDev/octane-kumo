/** @jsxImportSource octane */
import { Collapsible } from "../../src/components/collapsible/collapsible";

export function CollapsibleHydrationFixture() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>Hydrated details</Collapsible.Trigger>
      <Collapsible.Panel>
        <span>Hydrated disclosure content</span>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
