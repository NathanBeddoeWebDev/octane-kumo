/** @jsxImportSource octane */
import { Badge } from "../../src/components/badge/badge";
import { Empty } from "../../src/components/empty/empty";
import { SkeletonLine } from "../../src/components/loader/skeleton-line";
import { Meter } from "../../src/components/meter/meter";

export function StatusHydrationFixture() {
  return (
    <section>
      <Badge appearance="dot" variant="success">
        Operational
      </Badge>
      <SkeletonLine />
      <Meter label="Storage used" value={65} />
      <Empty commandLine="pnpm add octane-kumo" title="No resources" />
    </section>
  );
}
