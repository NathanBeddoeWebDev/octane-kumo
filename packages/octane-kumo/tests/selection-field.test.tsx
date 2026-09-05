/** @jsxImportSource octane */
import {
  Button,
  ComboBox,
  Input,
  Select,
  SelectValue,
} from "@octanejs/aria/components";
import { cleanup, render, screen } from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { SelectionFieldPresentation } from "../src/utils/selection-field";

afterEach(cleanup);

describe("SelectionFieldPresentation", () => {
  it("keeps ComboBox label and description IDs associated with its input", () => {
    render(() => (
      <ComboBox>
        <SelectionFieldPresentation
          description="Choose the closest region"
          label="Region"
          required={false}
        >
          <Input />
        </SelectionFieldPresentation>
      </ComboBox>
    ));

    const input = screen.getByRole("combobox", {
      name: "Region (optional)",
    });
    const description = screen.getByText("Choose the closest region");
    expect(input.getAttribute("aria-labelledby")).toContain(
      screen.getByText("Region").closest("label")?.id,
    );
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("uses the error instead of the description and associates its ID", () => {
    render(() => (
      <Select isInvalid>
        <SelectionFieldPresentation
          description="Choose one environment"
          error="Environment is required"
          label="Environment"
        >
          <Button>
            <SelectValue />
          </Button>
        </SelectionFieldPresentation>
      </Select>
    ));

    const trigger = screen.getByRole("button", { name: /Environment/ });
    const error = screen.getByText("Environment is required");
    expect(screen.queryByText("Choose one environment")).toBeNull();
    expect(trigger.getAttribute("aria-describedby")).toContain(error.id);
  });

  it("filters boolean and ValidityState error matches", () => {
    const { rerender } = render(() => (
      <ComboBox isInvalid>
        <SelectionFieldPresentation
          error={{ match: false, message: "Hidden boolean error" }}
          label="Service"
        >
          <Input />
        </SelectionFieldPresentation>
      </ComboBox>
    ));

    expect(screen.queryByText("Hidden boolean error")).toBeNull();

    rerender(() => (
      <ComboBox isInvalid>
        <SelectionFieldPresentation
          error={{ match: "valid", message: "Hidden validity error" }}
          label="Service"
        >
          <Input />
        </SelectionFieldPresentation>
      </ComboBox>
    ));

    expect(screen.queryByText("Hidden validity error")).toBeNull();

    rerender(() => (
      <ComboBox isInvalid validate={() => "Invalid service"} value="bad">
        <SelectionFieldPresentation
          error={{ match: "customError", message: "Matching validity error" }}
          label="Service"
        >
          <Input />
        </SelectionFieldPresentation>
      </ComboBox>
    ));

    expect(screen.getByText("Matching validity error")).toBeTruthy();
  });
});
