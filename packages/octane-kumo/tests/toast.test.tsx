/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { useEffect } from "octane";
import {
  Toasty,
  ToastProvider,
  createKumoToastManager,
  useKumoToastManager,
} from "../src/components/toast";
import { KumoPortalProvider } from "../src/utils/portal-provider";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("native Toast", () => {
  it("preserves the provider alias and accepts in-tree mount dispatch", async () => {
    expect(ToastProvider).toBe(Toasty);
    function Trigger() {
      const manager = useKumoToastManager();
      useEffect(() => {
        manager.add({ title: "From inside", timeout: 0 });
      }, []);
      return null;
    }
    render(() => (
      <Toasty>
        <Trigger />
      </Toasty>
    ));
    expect(await screen.findByText("From inside")).toBeTruthy();
  });
  it.each(["default", "success", "error", "warning", "info"] as const)(
    "renders %s with content and native actions",
    async (variant) => {
      const manager = createKumoToastManager();
      const click = vi.fn();
      render(() => (
        <Toasty toastManager={manager}>
          <div />
        </Toasty>
      ));
      act(() =>
        manager.add({
          title: "Saved",
          description: "Changes persisted",
          variant,
          timeout: 0,
          actions: [{ children: "Undo", onClick: click }],
        }),
      );
      const dialog = await screen.findByRole("dialog", { name: "Saved" });
      expect(dialog.querySelectorAll("[data-toast-icon]")).toHaveLength(
        variant === "default" ? 0 : 1,
      );
      expect(screen.getByText("Changes persisted")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(click.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    },
  );
  it("shares external and hook dispatch, upserts external IDs, and updates custom content", async () => {
    const external = createKumoToastManager();
    let inside!: ReturnType<typeof useKumoToastManager>;
    function Capture() {
      inside = useKumoToastManager();
      return null;
    }
    render(() => (
      <Toasty toastManager={external}>
        <Capture />
      </Toasty>
    ));
    act(() => external.add({ id: "same", title: "First", timeout: 0 }));
    await screen.findByText("First");
    act(() => external.add({ id: "same", title: "Second", timeout: 0 }));
    await screen.findByText("Second");
    expect(document.querySelectorAll("[data-toast-title]")).toHaveLength(1);
    act(() => inside.add({ title: "Hook dispatch", timeout: 0 }));
    await screen.findByText("Hook dispatch");
    act(() =>
      external.update("same", { content: <strong>Custom content</strong> }),
    );
    expect(await screen.findByText("Custom content")).toBeTruthy();
    act(() => external.close());
    await waitFor(() =>
      expect(screen.queryAllByRole("dialog")).toHaveLength(0),
    );
  });
  it("bumps in-tree duplicates without replacing their title and ignores ending duplicates", async () => {
    let manager!: ReturnType<typeof useKumoToastManager>;
    function Capture() {
      manager = useKumoToastManager();
      return null;
    }
    render(() => (
      <Toasty>
        <Capture />
      </Toasty>
    ));
    act(() => manager.add({ id: "same", title: "Original", timeout: 0 }));
    await screen.findByText("Original");
    act(() => manager.add({ id: "same", title: "Ignored", timeout: 0 }));
    await waitFor(() =>
      expect(document.querySelector(".animate-toast-bump")).toBeTruthy(),
    );
    expect(screen.queryByText("Ignored")).toBeNull();
    expect(manager.toasts).toHaveLength(1);
    act(() => {
      manager.close("same");
      manager.add({ id: "same", title: "Still ignored" });
    });
    expect(screen.queryByText("Still ignored")).toBeNull();
  });
  it("routes to the explicit portal container before the inherited one", async () => {
    const inherited = document.createElement("div");
    const explicit = document.createElement("div");
    document.body.append(inherited, explicit);
    const manager = createKumoToastManager();
    const view = render(() => (
      <KumoPortalProvider container={inherited}>
        <Toasty container={explicit} toastManager={manager}>
          <span>App</span>
        </Toasty>
      </KumoPortalProvider>
    ));
    act(() => manager.add({ title: "Routed", timeout: 0 }));
    await screen.findByText("Routed");
    expect(explicit.textContent).toContain("Routed");
    expect(inherited.textContent).not.toContain("Routed");
    view.unmount();
    expect(explicit.children).toHaveLength(0);
    inherited.remove();
    explicit.remove();
  });
  it("settles promise success/error and preserves native data and Kumo fields", async () => {
    const manager = createKumoToastManager();
    render(() => (
      <Toasty toastManager={manager}>
        <div />
      </Toasty>
    ));
    let resolve!: (value: number) => void;
    const input = new Promise<number>((done) => {
      resolve = done;
    });
    let result!: Promise<number>;
    act(() => {
      result = manager.promise(input, {
        loading: { title: "Working" },
        success: (value) => ({
          title: `Saved ${value}`,
          variant: "success",
          timeout: 0,
          data: { count: value },
        }),
        error: { title: "Failed", variant: "error" },
      });
    });
    await screen.findByText("Working");
    await act(async () => {
      resolve(42);
      expect(await result).toBe(42);
    });
    expect(await screen.findByText("Saved 42")).toBeTruthy();
    await act(async () => {
      const rejected = manager.promise(Promise.reject(new Error("Denied")), {
        loading: { title: "Retrying" },
        success: { title: "Unexpected" },
        error: (error) => ({
          title: error.message,
          variant: "error",
          timeout: 0,
        }),
      });
      await expect(rejected).rejects.toThrow("Denied");
    });
    expect(await screen.findByText("Denied")).toBeTruthy();
  });
  it("expires on timeout and invokes close then remove only once", async () => {
    const manager = createKumoToastManager();
    const events: string[] = [];
    render(() => (
      <Toasty toastManager={manager}>
        <div />
      </Toasty>
    ));
    act(() =>
      manager.add({
        title: "Short lived",
        timeout: 50,
        onClose: () => events.push("close"),
        onRemove: () => events.push("remove"),
      }),
    );
    await screen.findByText("Short lived");
    await waitFor(() => expect(screen.queryByText("Short lived")).toBeNull());
    expect(events).toEqual(["close", "remove"]);
  });
});
