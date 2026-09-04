/** @jsxImportSource octane */
import { useState } from "octane";
import { Button } from "../../src/components/button/button";

export function ButtonHydrationFixture() {
  const [count, setCount] = useState(0);

  return (
    <Button
      onClick={() => setCount((value) => value + 1)}
      children={`Count: ${count}`}
    />
  );
}
