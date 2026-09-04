/** @jsxImportSource octane */
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { InputArea, Textarea } from "../src/components/input/input-area";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("InputArea", () => {
  it("provides a labeled native textarea contract", () => {
    const ref: { current: HTMLTextAreaElement | null } = { current: null };
    let inputEvent: InputEvent | undefined;
    let value: string | undefined;

    render(InputArea, {
      props: {
        description: "Add deployment context",
        label: "Notes",
        onInput: (event: InputEvent) => {
          inputEvent = event;
        },
        onValueChange: (nextValue: string) => {
          value = nextValue;
        },
        ref,
      },
    });

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const description = screen.getByText("Add deployment context");
    fireEvent.input(textarea, { target: { value: "Runs near users" } });

    expect(Textarea).toBe(InputArea);
    expect(ref.current).toBe(textarea);
    expect(inputEvent).toBeInstanceOf(InputEvent);
    expect(value).toBe("Runs near users");
    expect(textarea.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("auto-resizes within its minimum and maximum rows", () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
      .mockReturnValue(200);

    render(InputArea, {
      props: {
        "aria-label": "Notes",
        autoResize: true,
        maxRows: 5,
        minRows: 3,
        style: { lineHeight: "20px" },
      },
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea.getAttribute("rows")).toBe("3");
    expect(textarea.style.height).toBe("100px");
    expect(textarea.style.overflowY).toBe("auto");
    expect(textarea.className).toContain("resize-none");

    scrollHeight.mockReturnValue(20);
    fireEvent.input(textarea, { target: { value: "Short" } });
    expect(textarea.style.height).toBe("60px");
    expect(textarea.style.overflowY).toBe("hidden");
  });

  it("resizes uncontrolled input and preserves both native callbacks", () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
      .mockReturnValue(96);
    const onInput = vi.fn();
    const onValueChange = vi.fn();

    render(InputArea, {
      props: {
        "aria-label": "Notes",
        autoResize: true,
        onInput,
        onValueChange,
      },
    });

    const textarea = screen.getByRole("textbox");
    fireEvent.input(textarea, { target: { value: "Longer value" } });

    expect(textarea.style.height).toBe("96px");
    expect(onInput).toHaveBeenCalledOnce();
    expect(onInput.mock.calls[0]?.[0]).toBeInstanceOf(InputEvent);
    expect(onValueChange).toHaveBeenCalledWith("Longer value");
  });

  it("remeasures controlled values after rerender", () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
      .mockReturnValue(40);
    const { rerender } = render(InputArea, {
      props: {
        "aria-label": "Notes",
        autoResize: true,
        value: "One line",
      },
    });
    const textarea = screen.getByRole("textbox");
    expect(textarea.style.height).toBe("40px");

    scrollHeight.mockReturnValue(120);
    rerender({
      props: {
        "aria-label": "Notes",
        autoResize: true,
        value: "Several\nlines\nof text",
      },
    });
    expect(textarea.style.height).toBe("120px");
  });

  it("restores inline sizing when autoResize is disabled or unmounted", () => {
    vi.spyOn(
      HTMLTextAreaElement.prototype,
      "scrollHeight",
      "get",
    ).mockReturnValue(80);
    const { rerender, unmount } = render(InputArea, {
      props: {
        "aria-label": "Notes",
        autoResize: true,
        defaultValue: "Initial",
      },
    });
    const textarea = screen.getByRole("textbox");
    expect(textarea.style.height).toBe("80px");

    rerender({
      props: { "aria-label": "Notes", defaultValue: "Initial" },
    });
    expect(textarea.style.height).toBe("");
    expect(textarea.style.overflowY).toBe("");

    textarea.style.height = "240px";
    rerender({
      props: {
        "aria-label": "Notes",
        autoResize: true,
        defaultValue: "Initial",
      },
    });
    expect(textarea.style.height).toBe("80px");

    unmount();
    expect(textarea.style.height).toBe("");
    expect(textarea.style.overflowY).toBe("");
  });
});
