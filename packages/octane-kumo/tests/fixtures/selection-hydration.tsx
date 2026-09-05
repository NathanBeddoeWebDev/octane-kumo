/** @jsxImportSource octane */
import { useState } from "octane";
import { Autocomplete } from "../../src/components/autocomplete/autocomplete";
import { Combobox } from "../../src/components/combobox/combobox";
import { Select } from "../../src/components/select/select";

const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
];

export function SelectionHydrationFixture() {
  const [environment, setEnvironment] = useState("production");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState(languages[0]);

  return (
    <div>
      <Select
        aria-label="Hydrated environment"
        onValueChange={(value) => setEnvironment(value as string)}
        value={environment}
      >
        <Select.Option value="production">Production</Select.Option>
        <Select.Option value="staging">Staging</Select.Option>
      </Select>
      <output data-testid="hydrated-select-value">{environment}</output>

      <Autocomplete
        aria-label="Hydrated country"
        items={["Argentina", "Brazil", "Canada"]}
        onValueChange={setCountry}
        value={country}
      >
        <Autocomplete.InputGroup placeholder="Country" />
        <Autocomplete.Content>
          <Autocomplete.List>
            {(item: string) => (
              <Autocomplete.Item value={item}>{item}</Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Content>
      </Autocomplete>
      <output data-testid="hydrated-autocomplete-value">{country}</output>

      <Combobox
        aria-label="Hydrated language"
        items={languages}
        onValueChange={(value) =>
          value ? setLanguage(value as (typeof languages)[number]) : undefined
        }
        value={language}
      >
        <Combobox.TriggerInput placeholder="Language" />
        <Combobox.Content>
          <Combobox.List>
            {(item: (typeof languages)[number]) => (
              <Combobox.Item value={item}>{item.label}</Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox>
      <output data-testid="hydrated-combobox-value">{language.value}</output>
    </div>
  );
}
