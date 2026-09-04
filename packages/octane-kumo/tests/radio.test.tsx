/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  Radio,
  type RadioGroupChangeEventDetails,
} from "../src/components/radio/radio";

afterEach(cleanup);

describe("Radio", () => {
  it("selects one value and reports native change details", async () => {
    const values: string[] = [];
    let details: RadioGroupChangeEventDetails | undefined;

    function RadioFixture() {
      return (
        <Radio.Group
          defaultValue="email"
          legend="Contact method"
          onValueChange={(value, eventDetails) => {
            values.push(value);
            details = eventDetails;
          }}
        >
          <Radio.Item label="Email" value="email" />
          <Radio.Item label="Phone" value="phone" />
        </Radio.Group>
      );
    }

    render(RadioFixture);
    const email = screen.getByRole("radio", { name: "Email" });
    const phone = screen.getByRole("radio", { name: "Phone" });
    expect(
      screen.getByRole("radiogroup", { name: "Contact method" }),
    ).toBeTruthy();
    expect(email.getAttribute("aria-checked")).toBe("true");
    expect(phone.getAttribute("aria-checked")).toBe("false");
    expect(email.classList.contains("after:-inset-x-3")).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByText("Phone"));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(values).toEqual(["phone"]);
      expect(phone.getAttribute("aria-checked")).toBe("true");
    });
    expect(details?.reason).toBe("none");
    expect(details?.event).toBeInstanceOf(Event);
  });

  it("preserves controlled state and forwards the item ref", async () => {
    let nextValue: string | undefined;
    const ref: { current: HTMLButtonElement | null } = { current: null };

    function ControlledFixture({ value }: { value: string }) {
      return (
        <Radio.Group
          legend="Region"
          onValueChange={(next) => {
            nextValue = next;
          }}
          value={value}
        >
          <Radio.Item label="Americas" ref={ref} value="americas" />
          <Radio.Item label="Europe" value="europe" />
        </Radio.Group>
      );
    }

    const { rerender } = render(ControlledFixture, {
      props: { value: "americas" },
    });
    const americas = screen.getByRole("radio", { name: "Americas" });
    const europe = screen.getByRole("radio", { name: "Europe" });
    expect(ref.current).toBe(americas);

    await act(async () => {
      fireEvent.click(europe);
      await Promise.resolve();
    });
    expect(nextValue).toBe("europe");
    expect(americas.getAttribute("aria-checked")).toBe("true");
    expect(europe.getAttribute("aria-checked")).toBe("false");

    rerender({ props: { value: "europe" } });
    expect(europe.getAttribute("aria-checked")).toBe("true");
  });

  it("supports roving arrow-key selection", async () => {
    function KeyboardFixture() {
      return (
        <Radio.Group defaultValue="small" legend="Size">
          <Radio.Item label="Small" value="small" />
          <Radio.Item label="Medium" value="medium" />
          <Radio.Item label="Large" value="large" />
        </Radio.Group>
      );
    }

    render(KeyboardFixture);
    const small = screen.getByRole("radio", { name: "Small" });
    const medium = screen.getByRole("radio", { name: "Medium" });
    small.focus();

    await act(async () => {
      fireEvent.keyDown(small, { key: "ArrowDown" });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(medium);
      expect(medium.getAttribute("aria-checked")).toBe("true");
    });
  });

  it("serializes numeric values through a native form", () => {
    function NumericFixture() {
      return (
        <form data-testid="page-form">
          <Radio.Group<number>
            defaultValue={25}
            legend="Items per page"
            name="pageSize"
          >
            <Radio.Item<number> label="10" value={10} />
            <Radio.Item<number> label="25" value={25} />
          </Radio.Group>
        </form>
      );
    }

    render(NumericFixture);
    const form = screen.getByTestId("page-form") as HTMLFormElement;
    expect(new FormData(form).get("pageSize")).toBe("25");
  });

  it("renders rich card choices with appearance-aware control placement", () => {
    function CardsFixture() {
      return (
        <>
          <Radio.Group appearance="card" defaultValue="pro" legend="Plan">
            <Radio.Item
              description="For professional websites"
              label={
                <span>
                  Pro <strong>Popular</strong>
                </span>
              }
              value="pro"
            />
          </Radio.Group>
          <Radio.Group
            appearance="card"
            controlPosition="start"
            defaultValue="free"
            legend="Free plan"
          >
            <Radio.Item
              description="For experiments"
              label="Free"
              value="free"
            />
          </Radio.Group>
        </>
      );
    }

    render(CardsFixture);
    const pro = screen.getByRole("radio", { name: "Pro Popular" });
    const proCard = pro.closest('[data-kumo-part="item-label"]');
    const free = screen.getByRole("radio", { name: "Free" });
    const freeCard = free.closest('[data-kumo-part="item-label"]');
    expect(screen.getByText("For professional websites")).toBeTruthy();
    expect(proCard?.classList.contains("flex-row-reverse")).toBe(false);
    expect(freeCard?.classList.contains("flex-row-reverse")).toBe(true);
    expect(pro.getAttribute("aria-describedby")).toBeTruthy();
    expect(pro.classList.contains("after:-inset-x-3")).toBe(false);
  });

  it("renders group states and hides item descriptions outside cards", () => {
    function StatesFixture() {
      return (
        <Radio.Group
          description="Pick exactly one"
          disabled
          error="A destination is required"
        >
          <Radio.Legend>Destination</Radio.Legend>
          <Radio.Item
            description="Not rendered"
            label="Production"
            value="production"
            variant="error"
          />
        </Radio.Group>
      );
    }

    render(StatesFixture);
    const production = screen.getByRole("radio", { name: "Production" });
    expect(
      screen.getByRole("radiogroup", { name: "Destination" }),
    ).toBeTruthy();
    expect(production.hasAttribute("disabled")).toBe(true);
    expect(production.classList.contains("ring-kumo-danger")).toBe(true);
    expect(screen.queryByText("Not rendered")).toBeNull();
    expect(screen.getByText("A destination is required")).toBeTruthy();
    expect(screen.getByText("Pick exactly one")).toBeTruthy();
  });
});
