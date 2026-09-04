/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { SensitiveInput } from "../src/components/sensitive-input/sensitive-input";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("SensitiveInput", () => {
  it("masks existing values with accessible reveal instructions", () => {
    const ref: { current: HTMLInputElement | null } = { current: null };
    render(SensitiveInput, {
      props: { defaultValue: "secret", label: "API key", ref },
    });

    const container = screen.getByRole("button", {
      name: "API key, masked.",
    });
    const input = ref.current!;
    expect(input.type).toBe("password");
    expect(input.value).toBe("secret");
    expect(input.readOnly).toBe(true);
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute("aria-hidden")).toBe("true");
    expect(container.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Click or press Enter to reveal.")).toBeTruthy();
    expect(screen.getByText("••••••••")).toBeTruthy();
  });

  it("reveals by pointer or keyboard and masks on Escape", async () => {
    vi.useFakeTimers();
    render(SensitiveInput, {
      props: { "aria-label": "Secret", defaultValue: "token" },
    });

    const masked = screen.getByRole("button", { name: "Secret, masked." });
    fireEvent.keyDown(masked, { key: "Enter" });
    await act(async () => vi.runAllTimers());

    const input = document.querySelector<HTMLInputElement>("input")!;
    expect(input.type).toBe("text");
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("button", { name: "Hide value" })).toBeTruthy();

    fireEvent.keyDown(input, { key: "Escape" });
    await act(async () => vi.runAllTimers());
    expect(input.type).toBe("password");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Secret, masked." }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Secret, masked." }));
    await act(async () => vi.runAllTimers());
    expect(input.type).toBe("text");
  });

  it("supports uncontrolled editing with native events", () => {
    let nativeEvent: InputEvent | undefined;
    let value = "";
    render(SensitiveInput, {
      props: {
        "aria-label": "Secret",
        name: "secret",
        onInput: (event: InputEvent) => {
          nativeEvent = event;
        },
        onValueChange: (nextValue: string) => {
          value = nextValue;
        },
      },
    });

    const input = document.querySelector<HTMLInputElement>("input")!;
    expect(input.type).toBe("password");
    fireEvent.input(input, { target: { value: "new-secret" } });
    expect(input.type).toBe("text");
    expect(input.value).toBe("new-secret");
    expect(value).toBe("new-secret");
    expect(nativeEvent).toBeInstanceOf(InputEvent);
  });

  it("keeps controlled values owned by the consumer", () => {
    let changed = "";
    const { rerender } = render(SensitiveInput, {
      props: {
        "aria-label": "Token",
        onValueChange: (value: string) => {
          changed = value;
        },
        value: "first",
      },
    });
    const input = document.querySelector<HTMLInputElement>("input")!;

    fireEvent.input(input, { target: { value: "attempted" } });
    expect(changed).toBe("attempted");
    expect(input.value).toBe("first");

    rerender({ props: { "aria-label": "Token", value: "second" } });
    expect(input.value).toBe("second");
  });

  it("copies through the Clipboard API and announces success", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onCopy = vi.fn();
    render(SensitiveInput, {
      props: { "aria-label": "Token", defaultValue: "copy-me", onCopy },
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      );
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("copy-me");
    expect(onCopy).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Copied" }).textContent).toBe(
      "Copied",
    );
    expect(
      document.querySelector('[aria-live="polite"]')?.textContent,
    ).toContain("Copied to clipboard");
  });

  it("falls back to execCommand when Clipboard API copy fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => Promise.reject(new Error("no"))) },
    });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const onCopy = vi.fn();
    render(SensitiveInput, {
      props: { "aria-label": "Token", defaultValue: "fallback", onCopy },
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(onCopy).toHaveBeenCalledOnce();
    expect(document.body.querySelector("textarea")).toBeNull();
  });

  it("does not announce fallback copy when execCommand reports failure", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });
    const onCopy = vi.fn();
    render(SensitiveInput, {
      props: { "aria-label": "Token", defaultValue: "fallback", onCopy },
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      );
      await Promise.resolve();
    });

    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
    expect(
      document.querySelector('[aria-live="polite"]')?.textContent,
    ).not.toContain("Copied to clipboard");
  });

  it("preserves disabled, read-only, validation, and form behavior", () => {
    render(() => (
      <form data-testid="form">
        <SensitiveInput
          defaultValue="disabled"
          disabled
          label="Disabled secret"
          name="disabledSecret"
        />
        <SensitiveInput
          defaultValue="readonly"
          error="Invalid key"
          label="Read-only secret"
          name="secret"
          readOnly
        />
      </form>
    ));

    const disabled = screen.getByRole("button", {
      name: "Disabled secret, masked.",
    });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.tabIndex).toBe(-1);
    fireEvent.click(disabled);

    const inputs = document.querySelectorAll<HTMLInputElement>("input");
    expect(inputs[0]?.type).toBe("password");
    fireEvent.click(
      screen.getByRole("button", { name: "Read-only secret, masked." }),
    );
    expect(inputs[1]?.type).toBe("text");
    expect(inputs[1]?.readOnly).toBe(true);
    expect(inputs[1]?.getAttribute("aria-describedby")).toContain(
      screen.getByText("Invalid key").id,
    );

    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.has("disabledSecret")).toBe(false);
    expect(data.get("secret")).toBe("readonly");
  });
});
