/** @jsxImportSource octane */
import { cleanup, fireEvent, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  Input,
  type InputValueChangeDetails,
} from "../src/components/input/input";
import { Label } from "../src/components/label/label";

afterEach(cleanup);

function StandaloneLabelFixture() {
  return (
    <div>
      <Label htmlFor="email" showOptional>
        Email
      </Label>
      <input id="email" />
    </div>
  );
}

describe("Label", () => {
  it("labels a native control and renders the optional indicator", () => {
    render(StandaloneLabelFixture);

    const input = screen.getByLabelText("Email (optional)");
    expect(input.getAttribute("id")).toBe("email");
    expect(screen.getByText("(optional)")).toBeTruthy();
  });
});

describe("Input", () => {
  it("associates its label and description with the native input", () => {
    render(Input, {
      props: {
        description: "Used for account recovery",
        label: "Email",
        name: "email",
        placeholder: "you@example.com",
      },
    });

    const input = screen.getByRole("textbox", { name: "Email" });
    const description = screen.getByText("Used for account recovery");
    expect(input.getAttribute("name")).toBe("email");
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("forwards its ref and delivers a native input event", () => {
    const ref: { current: HTMLInputElement | null } = { current: null };
    let received: InputEvent | undefined;
    render(Input, {
      props: {
        "aria-label": "Search",
        onInput: (event: InputEvent) => {
          received = event;
        },
        ref,
      },
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.input(input, { target: { value: "workers" } });

    expect(ref.current).toBe(input);
    expect(received).toBeInstanceOf(InputEvent);
    expect((input as HTMLInputElement).value).toBe("workers");
  });

  it("composes render elements and callbacks through Base Input", () => {
    const elementRef: { current: HTMLInputElement | null } = { current: null };
    let elementInputs = 0;
    const { unmount } = render(Input, {
      props: {
        "aria-label": "Element composition",
        onInput: () => elementInputs++,
        ref: elementRef,
        render: (
          <input data-composed="element" onInput={() => elementInputs++} />
        ),
      },
    });
    const elementInput = screen.getByRole("textbox", {
      name: "Element composition",
    });
    fireEvent.input(elementInput, { target: { value: "one" } });
    expect(elementInput.getAttribute("data-composed")).toBe("element");
    expect(elementRef.current).toBe(elementInput);
    expect(elementInputs).toBe(2);
    unmount();

    const callbackRef: { current: HTMLInputElement | null } = { current: null };
    let callbackInputs = 0;
    let renderState: { disabled: boolean; focused: boolean } | undefined;
    render(Input, {
      props: {
        "aria-label": "Callback composition",
        disabled: true,
        onInput: () => callbackInputs++,
        ref: callbackRef,
        render: (props, state) => {
          renderState = state;
          return (
            <input
              {...props}
              data-composed="callback"
              onInput={(event) => {
                props.onInput?.(event);
                callbackInputs++;
              }}
            />
          );
        },
      },
    });
    const callbackInput = screen.getByRole("textbox", {
      name: "Callback composition",
    });
    fireEvent.input(callbackInput, { target: { value: "two" } });
    expect(callbackInput.getAttribute("data-composed")).toBe("callback");
    expect(callbackInput.hasAttribute("disabled")).toBe(true);
    expect(callbackRef.current).toBe(callbackInput);
    expect(callbackInputs).toBe(2);
    expect(renderState).toMatchObject({ disabled: true, focused: false });
  });

  it("reports value changes with native Base UI details", () => {
    let value: string | undefined;
    let details: InputValueChangeDetails | undefined;
    render(Input, {
      props: {
        "aria-label": "Filter",
        onValueChange: (
          nextValue: string,
          eventDetails: InputValueChangeDetails,
        ) => {
          value = nextValue;
          details = eventDetails;
        },
      },
    });

    fireEvent.input(screen.getByRole("textbox", { name: "Filter" }), {
      target: { value: "active" },
    });

    expect(value).toBe("active");
    expect(details?.reason).toBe("none");
    expect(details?.event).toBeInstanceOf(InputEvent);
  });

  it("shows an associated error instead of helper text", () => {
    render(Input, {
      props: {
        description: "Must be a work address",
        error: "Enter a valid email",
        label: "Email",
        type: "email",
      },
    });

    const input = screen.getByRole("textbox", { name: "Email" });
    const error = screen.getByText("Enter a valid email");
    expect(input.classList.contains("!ring-kumo-danger")).toBe(true);
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
    expect(screen.queryByText("Must be a work address")).toBeNull();
  });

  it("marks optional fields and suppresses password-manager overlays", () => {
    render(Input, {
      props: {
        label: "API key",
        passwordManagerIgnore: true,
        required: false,
      },
    });

    const input = screen.getByRole("textbox", { name: "API key (optional)" });
    expect(input.classList.contains("keeper-ignore")).toBe(true);
    expect(input.getAttribute("data-1p-ignore")).toBe("true");
    expect(input.getAttribute("data-bwignore")).toBe("true");
    expect(input.getAttribute("data-lpignore")).toBe("true");
    expect(input.getAttribute("data-form-type")).toBe("other");
  });
});
