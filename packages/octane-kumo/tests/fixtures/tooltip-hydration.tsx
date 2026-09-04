/** @jsxImportSource octane */
import { Button } from "../../src/components/button/button";
import { Tooltip } from "../../src/components/tooltip/tooltip";

export function TooltipHydrationFixture() {
  return (
    <Tooltip
      content="Hydrated help"
      delay={0}
      render={<Button />}
      children="Help"
    />
  );
}
