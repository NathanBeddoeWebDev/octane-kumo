/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { createElement } from "octane";
import { ClipboardText } from "../src/components/clipboard-text/clipboard-text";
import { KumoPortalProvider } from "../src/utils/portal-provider";

describe("ClipboardText", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function copy(name = "Copy to clipboard") {
    fireEvent.click(screen.getByRole("button", { name }));
    await act(() => Promise.resolve());
  }

  it("renders display text, forwards the native div ref, and defaults to lg", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(ClipboardText, { props: { text: "token", ref } });
    expect(screen.getByText("token")).toBeTruthy();
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.classList.contains("h-10")).toBe(true);
  });

  it.each([
    ["sm", "h-6.5", "text-xs"],
    ["base", "h-9", "text-sm"],
    ["lg", "h-10", "text-sm"],
  ] as const)("applies the %s size", (size, height, textSize) => {
    const { container } = render(ClipboardText, {
      props: { text: "value", size },
    });
    expect(container.firstElementChild?.classList.contains(height)).toBe(true);
    expect(container.firstElementChild?.classList.contains(textSize)).toBe(
      true,
    );
  });

  it("copies alternate and empty values and calls onCopy after success", async () => {
    const onCopy = vi.fn();
    const view = render(ClipboardText, {
      props: { text: "visible", textToCopy: "secret", onCopy },
    });
    await copy();
    expect(writeText).toHaveBeenLastCalledWith("secret");
    expect(onCopy).toHaveBeenCalledOnce();

    view.unmount();
    render(ClipboardText, { props: { text: "visible", textToCopy: "" } });
    await copy();
    expect(writeText).toHaveBeenLastCalledWith("");
  });

  it("uses the configured action and feedback labels", async () => {
    render(ClipboardText, {
      props: {
        text: "value",
        labels: { copyAction: "Copy API token" },
        tooltip: { copiedText: "Copied token" },
      },
    });
    await copy("Copy API token");
    expect(screen.getAllByText("Copied token").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("does not report success when both clipboard strategies fail", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });
    const onCopy = vi.fn();
    render(ClipboardText, { props: { text: "value", onCopy } });
    await copy();
    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("resets the 1500ms feedback window on repeat copy", async () => {
    vi.useFakeTimers();
    render(ClipboardText, { props: { text: "value" } });
    await copy();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await copy();
    await act(() => vi.advanceTimersByTimeAsync(1499));
    expect(screen.getByText("Copied")).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("restarts one anchored toast on repeat copy and clears its live feedback on expiry", async () => {
    vi.useFakeTimers();
    const view = render(ClipboardText, {
      props: { text: "source", tooltip: { copiedText: "Copied source" } },
    });
    await copy();
    const live = view.container.querySelector('[aria-live="polite"]');
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await copy();
    expect(
      document.querySelectorAll(".animate-clipboard-toast-bump"),
    ).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(1499));
    expect(live?.textContent).toBe("Copied source");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(live?.textContent).toBe("");
  });

  it("uses successful legacy fallback without leaving its textarea behind", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    });
    const onCopy = vi.fn();
    render(ClipboardText, { props: { text: "fallback", onCopy } });
    await copy();
    expect(onCopy).toHaveBeenCalledOnce();
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("isolates anchored feedback per instance and routes it through the portal", async () => {
    const portal = document.createElement("div");
    document.body.appendChild(portal);
    render(KumoPortalProvider, {
      props: {
        container: portal,
        children: [
          createElement(ClipboardText, {
            key: "one",
            text: "one",
            labels: { copyAction: "Copy one" },
            tooltip: { copiedText: "One copied" },
          }),
          createElement(ClipboardText, {
            key: "two",
            text: "two",
            labels: { copyAction: "Copy two" },
            tooltip: { copiedText: "Two copied" },
          }),
        ],
      },
    });
    await copy("Copy one");
    await waitFor(() => expect(portal.textContent).toContain("One copied"));
    expect(portal.textContent).not.toContain("Two copied");
    await copy("Copy two");
    await waitFor(() => expect(portal.textContent).toContain("Two copied"));
    expect(portal.querySelectorAll('[role="region"]')).toHaveLength(2);
    portal.remove();
  });

  it("ignores pending copy completion and clears feedback when unmounted", async () => {
    let resolve!: () => void;
    writeText.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const onCopy = vi.fn();
    const view = render(ClipboardText, { props: { text: "value", onCopy } });
    fireEvent.click(screen.getByRole("button"));
    view.unmount();
    await act(async () => {
      resolve();
      await Promise.resolve();
    });
    expect(onCopy).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("Copied");
  });
});
