/** @jsxImportSource octane */
import { createRoot, useState, useEffect } from "octane";
import { Button } from "octane-kumo";
import { FeedbackFixture } from "../fixtures/feedback";

function Preview() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.mode = dark ? "dark" : "light";
  }, [dark]);
  return (
    <main>
      <h1>Toast and clipboard feedback</h1>
      <p>
        Show notifications, expand the stack, dismiss with Escape or swipe, and
        copy by keyboard.
      </p>
      <Button onClick={() => setDark((value) => !value)}>
        Switch to {dark ? "light" : "dark"}
      </Button>
      <FeedbackFixture />
    </main>
  );
}
createRoot(document.getElementById("app")!).render(Preview);
