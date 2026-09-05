/**
 * Sidebar SSR regression test: `Sidebar.Provider` must render on the server
 * where `window` does not exist.
 *
 * Background: `useIsMobile` reads `window.matchMedia` in its
 * `useSyncExternalStore` snapshot. Octane's server runtime falls back to
 * `getSnapshot()` when the compiled call carries no slot arg, so an
 * unguarded access throws `window is not defined` during SSR and the app
 * flashes the root error boundary ("Something went wrong!") until hydration.
 */
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderHydrationFixture } from "./hydration-ssr";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Sidebar SSR without window", () => {
  it("renders the provider instead of the error boundary", async () => {
    vi.stubGlobal("window", undefined);
    const serverResult = await renderHydrationFixture(
      "tests/fixtures/sidebar-hydration.tsx",
      "SidebarHydrationFixture",
    );
    expect(serverResult.html).toContain("Home");
    expect(serverResult.html).not.toContain("Something went wrong");
  });
});
