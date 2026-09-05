/** @jsxImportSource octane */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@octanejs/testing-library";
import { useState } from "octane";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Autocomplete } from "../src/components/autocomplete/autocomplete";
import { Combobox } from "../src/components/combobox/combobox";
import { Select } from "../src/components/select/select";

afterEach(cleanup);

describe("Select", () => {
  it("opens, selects the original value, and preserves Kumo styling", async () => {
    const values: string[] = [];

    function Fixture() {
      return (
        <Select
          aria-label="Environment"
          onValueChange={(value) => values.push(value as string)}
          placeholder="Choose an environment"
          size="sm"
        >
          <Select.Option value="production">Production</Select.Option>
          <Select.Option value="staging">Staging</Select.Option>
        </Select>
      );
    }

    render(Fixture);
    const trigger = screen.getByRole("combobox", { name: "Environment" });
    expect(trigger.textContent).toContain("Choose an environment");
    expect(trigger.classList.contains("h-6.5")).toBe(true);

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());

    fireEvent.click(screen.getByRole("option", { name: "Staging" }));
    await waitFor(() => {
      expect(values).toEqual(["staging"]);
      expect(trigger.textContent).toContain("Staging");
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("opens from the keyboard in a custom portal container", async () => {
    const values: string[] = [];
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);

    try {
      function Fixture() {
        return (
          <Select<string>
            container={portalContainer}
            items={{ us: "United States", ca: "Canada" }}
            label="Country"
            onValueChange={(value) => value && values.push(value)}
          />
        );
      }

      render(Fixture);
      const trigger = screen.getByRole("combobox", { name: /Country/ });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "ArrowDown" });

      await waitFor(() => {
        expect(portalContainer.textContent).toContain("United States");
        expect(document.activeElement?.textContent).toContain("United States");
      });
      fireEvent.click(screen.getByRole("option", { name: "United States" }));

      await waitFor(() => expect(values).toEqual(["us"]));
    } finally {
      portalContainer.remove();
    }
  });

  it("maps object keys back to object values and ignores disabled options", async () => {
    type Region = { id: string; label: string };
    const regions: Region[] = [
      { id: "weur", label: "Western Europe" },
      { id: "eeur", label: "Eastern Europe" },
    ];
    const values: Region[] = [];

    function Fixture() {
      return (
        <Select
          aria-label="Region"
          items={regions.map((value) => ({ label: value.label, value }))}
          onValueChange={(value) => values.push(value as Region)}
          isItemEqualToValue={(item, value) => item.id === value.id}
        >
          <Select.Option value={regions[0]} disabled>
            {regions[0].label}
          </Select.Option>
          <Select.Option value={regions[1]}>{regions[1].label}</Select.Option>
        </Select>
      );
    }

    render(Fixture);
    fireEvent.click(screen.getByRole("combobox", { name: "Region" }));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());

    const disabledOption = screen.getByRole("option", {
      name: "Western Europe",
    });
    expect(disabledOption.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(disabledOption);
    expect(values).toEqual([]);

    fireEvent.click(screen.getByRole("option", { name: "Eastern Europe" }));
    await waitFor(() => expect(values).toEqual([regions[1]]));
  });

  it("generates options from item data, preserves descriptors, and omits null values", async () => {
    const values: string[] = [];

    render(() => (
      <Select
        aria-label="Fruit"
        items={{
          apple: "Apple",
          banana: { label: "Banana", disabled: true },
        }}
        onValueChange={(value) => values.push(value as string)}
      />
    ));

    fireEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    expect(
      screen
        .getByRole("option", { name: "Banana" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("option", { name: "Apple" }));
    await waitFor(() => expect(values).toEqual(["apple"]));

    cleanup();
    render(() => (
      <Select
        aria-label="Nullable fruit"
        items={[
          { label: "Choose fruit", value: null },
          { label: "Apple", value: "apple" },
        ]}
      />
    ));
    fireEvent.click(screen.getByRole("combobox", { name: "Nullable fruit" }));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    expect(screen.queryByRole("option", { name: "Choose fruit" })).toBeNull();
  });

  it("uses the matching null item as the selected label without listing it", async () => {
    render(() => (
      <Select
        aria-label="Nullable database"
        placeholder="Choose a database"
        value={null}
        items={[
          { label: "No database", value: null },
          { label: "PostgreSQL", value: "postgres" },
        ]}
      />
    ));

    const trigger = screen.getByRole("combobox", { name: "Nullable database" });
    expect(trigger.textContent).toContain("No database");
    expect(trigger.textContent).not.toContain("Choose a database");
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    expect(screen.queryByRole("option", { name: "No database" })).toBeNull();
  });

  it("supports controlled multiple values and trigger render composition", async () => {
    const changes: string[][] = [];

    function Fixture() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Select
          aria-label="Environments"
          multiple
          value={value}
          onValueChange={(nextValue) => {
            changes.push(nextValue);
            setValue(nextValue);
          }}
          render={(triggerProps, state) => (
            <button
              {...triggerProps}
              data-testid="composed-select"
              data-render-open={String(state.open)}
            />
          )}
        >
          <Select.Option value="production">Production</Select.Option>
          <Select.Option value="staging">Staging</Select.Option>
        </Select>
      );
    }

    render(Fixture);
    const trigger = screen.getByTestId("composed-select");
    expect(trigger.getAttribute("data-render-open")).toBe("false");
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(trigger.getAttribute("data-render-open")).toBe("true");
      expect(screen.getByRole("listbox")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("option", { name: "Production" }));
    await waitFor(() => expect(changes.at(-1)).toEqual(["production"]));
    fireEvent.click(screen.getByRole("option", { name: "Staging" }));
    await waitFor(() =>
      expect(changes.at(-1)).toEqual(["production", "staging"]),
    );
  });

  it("keeps read-only values inspectable without allowing selection", async () => {
    const changes: string[] = [];
    render(() => (
      <Select
        aria-label="Read-only environment"
        defaultValue="production"
        onValueChange={(value) => changes.push(value as string)}
        readOnly
      >
        <Select.Option value="production">Production</Select.Option>
        <Select.Option value="staging">Staging</Select.Option>
      </Select>
    ));

    const trigger = screen.getByRole("combobox", {
      name: "Read-only environment",
    });
    expect(trigger.getAttribute("aria-readonly")).toBe("true");
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());
    const staging = screen.getByRole("option", { name: "Staging" });
    expect(staging.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(staging);
    expect(changes).toEqual([]);
  });

  it("integrates a visible label, description, and error state", () => {
    render(() => (
      <Select
        label="Database"
        description="Select the primary database"
        error="A database is required"
        items={{ postgres: "PostgreSQL" }}
      />
    ));

    const trigger = screen.getByRole("combobox", { name: /Database/ });
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Database")).toBeTruthy();
    expect(screen.getByText("A database is required")).toBeTruthy();
    expect(screen.queryByText("Select the primary database")).toBeNull();
  });
});

describe("Autocomplete", () => {
  it("keeps free-form input controlled and filters suggestions", async () => {
    const changes: string[] = [];

    function Fixture() {
      const [value, setValue] = useState("");
      return (
        <Autocomplete
          aria-label="Country"
          items={["Argentina", "Brazil", "Canada"]}
          value={value}
          onValueChange={(nextValue) => {
            changes.push(nextValue);
            setValue(nextValue);
          }}
        >
          <Autocomplete.InputGroup placeholder="Search countries" />
          <Autocomplete.Content>
            <Autocomplete.List>
              {(item: string) => (
                <Autocomplete.Item id={item} value={item}>
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Content>
        </Autocomplete>
      );
    }

    render(Fixture);
    const input = screen.getByRole("combobox", {
      name: "Country",
    }) as HTMLInputElement;

    await act(async () => {
      input.focus();
      fireEvent.input(input, { target: { value: "Bra" } });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(changes.at(-1)).toBe("Bra");
      expect(input.value).toBe("Bra");
      expect(screen.getByRole("option", { name: "Brazil" })).toBeTruthy();
      expect(screen.queryByRole("option", { name: "Canada" })).toBeNull();
    });
  });

  it("filters object items with Kumo's callback and commits item text", async () => {
    type Country = { code: string; name: string };
    const countries: Country[] = [
      { code: "ZA", name: "South Africa" },
      { code: "KR", name: "South Korea" },
      { code: "JP", name: "Japan" },
    ];
    const changes: string[] = [];

    function Fixture() {
      const { contains } = Autocomplete.useFilter();
      return (
        <Autocomplete
          aria-label="Object country"
          items={countries}
          itemToStringValue={(country) => country.name}
          filter={contains}
          onValueChange={(value) => changes.push(value)}
        >
          <Autocomplete.InputGroup />
          <Autocomplete.Content>
            <Autocomplete.List>
              {(country: Country) => (
                <Autocomplete.Item id={country.code} value={country}>
                  {country.name}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Content>
        </Autocomplete>
      );
    }

    render(Fixture);
    const input = screen.getByRole("combobox", {
      name: "Object country",
    }) as HTMLInputElement;

    await act(async () => {
      input.focus();
      fireEvent.input(input, { target: { value: "korea" } });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "South Korea" })).toBeTruthy();
      expect(screen.queryByRole("option", { name: "South Africa" })).toBeNull();
    });

    fireEvent.click(screen.getByRole("option", { name: "South Korea" }));
    await waitFor(() => {
      expect(changes.at(-1)).toBe("South Korea");
      expect(input.value).toBe("South Korea");
    });
  });

  it("integrates a visible label and error state", () => {
    render(() => (
      <Autocomplete
        label="Office country"
        error="A country is required"
        items={["Argentina", "Brazil"]}
      >
        <Autocomplete.InputGroup />
        <Autocomplete.Content>
          <Autocomplete.List>
            {(country: string) => (
              <Autocomplete.Item value={country}>{country}</Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Content>
      </Autocomplete>
    ));

    expect(
      screen
        .getByRole("combobox", { name: "Office country" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.getAllByText("Office country").length).toBeGreaterThan(0);
    expect(screen.getByText("A country is required")).toBeTruthy();
  });
});

describe("Combobox", () => {
  it("selects an object value from a filtered list", async () => {
    type Language = { label: string; value: string };
    const languages: Language[] = [
      { label: "English", value: "en" },
      { label: "French", value: "fr" },
    ];
    const selected: Language[] = [];

    function Fixture() {
      return (
        <Combobox
          aria-label="Language"
          items={languages}
          onValueChange={(value) => selected.push(value as Language)}
        >
          <Combobox.TriggerInput placeholder="Select language" />
          <Combobox.Content>
            <Combobox.List>
              {(item: Language) => (
                <Combobox.Item id={item.value} value={item}>
                  {item.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox>
      );
    }

    render(Fixture);
    const input = screen.getByRole("combobox", {
      name: "Language",
    }) as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Show options" }));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy());

    fireEvent.click(screen.getByRole("option", { name: "French" }));
    await waitFor(() => {
      expect(selected).toEqual([languages[1]]);
      expect(input.value).toBe("French");
    });
  });

  it("renders selected chips and removes one value in multiple mode", async () => {
    type Bot = { label: string; value: string };
    const bots: Bot[] = [
      { label: "Googlebot", value: "google" },
      { label: "Bingbot", value: "bing" },
    ];

    function Fixture() {
      const [value, setValue] = useState<Bot[]>(bots);
      return (
        <Combobox
          aria-label="Bots"
          items={bots}
          multiple
          value={value}
          onValueChange={(nextValue) => setValue(nextValue as Bot[])}
        >
          <Combobox.TriggerMultipleWithInput
            placeholder="Select bots"
            renderItem={(item: Bot) => (
              <Combobox.Chip>{item.label}</Combobox.Chip>
            )}
          />
          <Combobox.Content>
            <Combobox.List>
              {(item: Bot) => (
                <Combobox.Item id={item.value} value={item}>
                  {item.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox>
      );
    }

    render(Fixture);
    expect(screen.getByText("Googlebot")).toBeTruthy();
    expect(screen.getByText("Bingbot")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await waitFor(() => {
      expect(screen.queryByText("Googlebot")).toBeNull();
      expect(screen.getByText("Bingbot")).toBeTruthy();
    });
  });

  it("filters through object values and composes a value trigger", async () => {
    type Language = { label: string; value: string };
    const languages: Language[] = [
      { label: "English", value: "en" },
      { label: "French", value: "fr" },
      { label: "German", value: "de" },
    ];

    function FilteredFixture() {
      const { startsWith } = Combobox.useFilter();
      return (
        <Combobox
          aria-label="Filtered language"
          items={languages}
          itemToStringLabel={(language) => language.label}
          filter={startsWith}
        >
          <Combobox.TriggerInput />
          <Combobox.Content>
            <Combobox.List>
              {(language: Language) => (
                <Combobox.Item value={language}>{language.label}</Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox>
      );
    }

    render(FilteredFixture);
    const input = screen.getByRole("combobox", {
      name: "Filtered language",
    });
    await act(async () => {
      input.focus();
      fireEvent.input(input, { target: { value: "fr" } });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "French" })).toBeTruthy();
      expect(screen.queryByRole("option", { name: "German" })).toBeNull();
    });

    cleanup();
    render(() => (
      <Combobox
        aria-label="Composed language"
        defaultValue={languages[0]}
        items={languages}
      >
        <Combobox.TriggerValue
          render={(triggerProps, state) => (
            <button
              {...triggerProps}
              data-testid="composed-combobox"
              data-render-open={String(state.open)}
            />
          )}
        />
        <Combobox.Content>
          <Combobox.List>
            {(language: Language) => (
              <Combobox.Item value={language}>{language.label}</Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox>
    ));
    const trigger = screen.getByTestId("composed-combobox");
    expect(trigger.textContent).toContain("English");
    expect(trigger.getAttribute("role")).toBe("combobox");
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(trigger.getAttribute("data-render-open")).toBe("true");
      expect(screen.getByRole("listbox")).toBeTruthy();
    });
  });

  it("integrates a visible label and error state", () => {
    render(() => (
      <Combobox
        label="Preferred language"
        error="A language is required"
        items={["English", "French"]}
      >
        <Combobox.TriggerInput />
        <Combobox.Content>
          <Combobox.List>
            {(language: string) => (
              <Combobox.Item value={language}>{language}</Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox>
    ));

    expect(
      screen
        .getByRole("combobox", { name: "Preferred language" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.getAllByText("Preferred language").length).toBeGreaterThan(0);
    expect(screen.getByText("A language is required")).toBeTruthy();
  });
});
