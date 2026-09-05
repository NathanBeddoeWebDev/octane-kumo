/** @jsxImportSource octane */
import { createRoot, useState, useEffect } from "octane";
import { Button } from "octane-kumo";
import { CommandPaletteFixture } from "../fixtures/command-palette";
function Preview() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.mode = dark ? "dark" : "light";
  }, [dark]);
  return (
    <main>
      <h1>Command palette</h1>
      <p>
        Search, navigate grouped results, and open a selection in a new tab.
      </p>
      <Button onClick={() => setDark(!dark)}>
        Switch to {dark ? "light" : "dark"}
      </Button>
      <CommandPaletteFixture />
    </main>
  );
}
createRoot(document.getElementById("app")!).render(Preview);
