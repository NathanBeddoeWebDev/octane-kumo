/** @jsxImportSource octane */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { useState } from "octane";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DeleteResource } from "../src/components/delete-resource/delete-resource";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ControlledFixture({
  caseSensitive = true,
}: {
  caseSensitive?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Reopen</button>
      <DeleteResource
        open={open}
        onOpenChange={setOpen}
        resourceType="Worker"
        resourceName="Edge API"
        caseSensitive={caseSensitive}
        onDelete={() => {}}
      />
    </div>
  );
}

describe("DeleteResource", () => {
  it("requires an exact confirmation by default and dispatches deletion once", async () => {
    const onDelete = vi.fn(async () => {});
    render(DeleteResource, {
      props: {
        open: true,
        onOpenChange: () => {},
        resourceType: "Worker",
        resourceName: "Edge API",
        onDelete,
      },
    });
    const input = screen.getByRole("textbox", {
      name: "Type Edge API to confirm deletion",
    });
    const button = screen.getByRole("button", { name: "Delete Worker" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.input(input, { target: { value: "edge api" } });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.input(input, { target: { value: "Edge API" } });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("ignores duplicate activation while deletion is pending", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onDelete = vi.fn(() => pending);
    render(DeleteResource, {
      props: {
        open: true,
        onOpenChange: () => {},
        resourceType: "Worker",
        resourceName: "Edge API",
        onDelete,
      },
    });
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "Edge API" },
    });
    const button = screen.getByRole("button", { name: "Delete Worker" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledTimes(1);
    finish();
    await pending;
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledTimes(2);
  });

  it("supports case-insensitive confirmation", () => {
    render(ControlledFixture, { props: { caseSensitive: false } });
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "edge api" },
    });
    expect(
      (
        screen.getByRole("button", {
          name: "Delete Worker",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("renders caller-owned loading, errors, custom text, classes, and size", () => {
    render(DeleteResource, {
      props: {
        open: true,
        onOpenChange: () => {},
        resourceType: "Zone",
        resourceName: "example.com",
        onDelete: () => {},
        isDeleting: true,
        errorMessage: "Deletion failed",
        deleteButtonText: "Permanently remove",
        className: "custom-dialog",
        size: "sm",
      },
    });
    expect(screen.getByText("Deletion failed")).toBeTruthy();
    expect(screen.getByRole("dialog").classList.contains("custom-dialog")).toBe(
      true,
    );
    expect(screen.getByRole("dialog").classList.contains("sm:w-72")).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Loading Permanently remove",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Close" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("shows copy success only when copying succeeds and resets after closing", async () => {
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(ControlledFixture);
    const copy = screen.getByRole("button", {
      name: "Copy Edge API to clipboard",
    });
    fireEvent.click(copy);
    await waitFor(() => expect(write).toHaveBeenCalledWith("Edge API"));
    await waitFor(() =>
      expect(
        copy.querySelector("svg")?.classList.contains("text-kumo-subtle"),
      ).toBe(false),
    );
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "Edge API" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(
      screen
        .getByRole("button", { name: "Copy Edge API to clipboard" })
        .querySelector("svg")
        ?.classList.contains("text-kumo-subtle"),
    ).toBe(true);
  });

  it("ignores a pending clipboard completion after closing and reopening", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(pending);
    render(ControlledFixture);
    fireEvent.click(
      screen.getByRole("button", { name: "Copy Edge API to clipboard" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    finish();
    await pending;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("Copied")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Copy Edge API to clipboard" })
        .querySelector("svg")
        ?.classList.contains("text-kumo-subtle"),
    ).toBe(true);
  });

  it("does not show copied feedback when both clipboard paths fail", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });
    render(ControlledFixture);
    const copy = screen.getByRole("button", {
      name: "Copy Edge API to clipboard",
    });
    fireEvent.click(copy);
    await waitFor(() =>
      expect(document.execCommand).toHaveBeenCalledWith("copy"),
    );
    expect(
      copy.querySelector("svg")?.classList.contains("text-kumo-subtle"),
    ).toBe(true);
  });
});
