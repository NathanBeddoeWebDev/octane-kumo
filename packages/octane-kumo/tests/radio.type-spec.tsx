/** @jsxImportSource octane */
import {
  Radio,
  type RadioGroupChangeEventDetails,
  type RadioGroupProps,
  type RadioItemProps,
} from "../src/components/radio/radio";

enum ThemeType {
  light = "light",
  dark = "dark",
  system = "system",
}

const numericGroup = (
  <Radio.Group<number>
    defaultValue={10}
    legend="Items per page"
    onValueChange={(value, details) => {
      value.toFixed();
      details.allowPropagation();
    }}
    value={25}
  >
    <Radio.Item<number> label="10" value={10} />
    <Radio.Item<number> label="25" value={25} />
  </Radio.Group>
);

const enumGroup = (
  <Radio.Group<ThemeType>
    legend="Theme"
    onValueChange={(value) => {
      const theme: ThemeType = value;
      void theme;
    }}
    value={ThemeType.system}
  >
    <Radio.Item<ThemeType> label="Light" value={ThemeType.light} />
    <Radio.Item<ThemeType> label="System" value={ThemeType.system} />
  </Radio.Group>
);

const stringGroup = (
  <Radio.Group legend="Theme" value="system">
    <Radio.Item label="Light" value="light" />
    <Radio.Item label="System" value="system" />
  </Radio.Group>
);

const numericGroupProps: RadioGroupProps<number> = {
  children: numericGroup,
  onValueChange: (value, eventDetails) => {
    value.toFixed();
    const details: RadioGroupChangeEventDetails = eventDetails;
    details.cancel();
  },
  value: 50,
};

const numericItemProps: RadioItemProps<number> = {
  label: "50",
  value: 50,
};

// @ts-expect-error default radio values are strings without a generic.
const defaultStringValue: RadioGroupProps = { children: stringGroup, value: 1 };

const mismatchedGroupValue: RadioGroupProps<number> = {
  children: numericGroup,
  // @ts-expect-error group value must match its declared generic.
  value: "25",
};

const mismatchedItemValue: RadioItemProps<number> = {
  label: "25",
  // @ts-expect-error item value must match its declared generic.
  value: "25",
};

export const __typeSpec = {
  defaultStringValue,
  enumGroup,
  mismatchedGroupValue,
  mismatchedItemValue,
  numericGroup,
  numericGroupProps,
  numericItemProps,
  stringGroup,
};
